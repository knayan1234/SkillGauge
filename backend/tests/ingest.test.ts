/**
 * Resume ingest tests.
 *
 * Mocks `pdf-parse` and `mammoth` so we don't need real fixture files in the repo
 * (real PDFs/DOCXs would inflate the diff and add test-data maintenance overhead).
 * Pinning behaviour:
 *   - Plain-text MIMEs round-trip through base64 decode without invoking either parser
 *   - PDF MIME calls pdf-parse with the decoded bytes; returns its `.text`
 *   - DOCX MIME calls mammoth.extractRawText; returns its `.value`
 *   - Legacy .doc (application/msword) throws UNSUPPORTED_MIME
 *   - Empty / whitespace-only output throws EMPTY_CONTENT
 *   - Parser exception surfaces as PARSE_FAILED with the original message wrapped
 *   - Unknown MIME falls back to UTF-8 decode (graceful — better than throwing on
 *     a slightly-unusual MIME the browser might surface)
 *   - Output is trimmed and capped at MAX_PARSED_LENGTH
 */

const mockPdfParse = jest.fn();
const mockMammothExtract = jest.fn();

jest.mock("pdf-parse", () => ({
  __esModule: true,
  default: (buf: Buffer) => mockPdfParse(buf),
}));
jest.mock("mammoth", () => ({
  __esModule: true,
  default: { extractRawText: (opts: unknown) => mockMammothExtract(opts) },
}));

import {
  MAX_PARSED_LENGTH,
  parseResume,
  ResumeParseError,
} from "../src/modules/sessions/ingest";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

beforeEach(() => {
  mockPdfParse.mockReset();
  mockMammothExtract.mockReset();
});

describe("parseResume — plain text", () => {
  it("base64-decodes a text/plain payload and trims it", async () => {
    const result = await parseResume({
      contentBase64: b64("  Jane Doe\nSenior Engineer  "),
      mime: "text/plain",
      fileName: "cv.txt",
    });
    expect(result).toBe("Jane Doe\nSenior Engineer");
    // Neither parser should have been called for plain text.
    expect(mockPdfParse).not.toHaveBeenCalled();
    expect(mockMammothExtract).not.toHaveBeenCalled();
  });

  it("falls back to UTF-8 decode for unknown MIMEs (graceful)", async () => {
    const result = await parseResume({
      contentBase64: b64("Some text content"),
      mime: "application/x-unknown",
      fileName: "weird.bin",
    });
    expect(result).toBe("Some text content");
  });
});

describe("parseResume — PDF", () => {
  it("dispatches to pdf-parse with the decoded buffer and returns its text", async () => {
    mockPdfParse.mockResolvedValueOnce({
      text: "  Jane Doe\nResume content extracted from PDF  ",
    });
    const result = await parseResume({
      contentBase64: b64("fake-pdf-bytes"),
      mime: "application/pdf",
      fileName: "cv.pdf",
    });
    expect(result).toBe("Jane Doe\nResume content extracted from PDF");
    expect(mockPdfParse).toHaveBeenCalledTimes(1);
    // Argument should be the base64-decoded Buffer.
    const arg = mockPdfParse.mock.calls[0][0] as Buffer;
    expect(Buffer.isBuffer(arg)).toBe(true);
    expect(arg.toString("utf8")).toBe("fake-pdf-bytes");
  });

  it("wraps a pdf-parse exception as PARSE_FAILED with the original message", async () => {
    mockPdfParse.mockRejectedValueOnce(new Error("Invalid PDF structure"));
    await expect(
      parseResume({
        contentBase64: b64("garbage"),
        mime: "application/pdf",
        fileName: "broken.pdf",
      }),
    ).rejects.toMatchObject({
      code: "PARSE_FAILED",
      message: expect.stringMatching(/broken\.pdf.*Invalid PDF structure/),
    });
  });
});

describe("parseResume — DOCX", () => {
  it("dispatches to mammoth.extractRawText and returns its value", async () => {
    mockMammothExtract.mockResolvedValueOnce({
      value: "Jane Doe\nResume content extracted from DOCX",
      messages: [],
    });
    const result = await parseResume({
      contentBase64: b64("fake-docx-bytes"),
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName: "cv.docx",
    });
    expect(result).toBe("Jane Doe\nResume content extracted from DOCX");
    expect(mockMammothExtract).toHaveBeenCalledTimes(1);
    const arg = mockMammothExtract.mock.calls[0][0] as { buffer: Buffer };
    expect(Buffer.isBuffer(arg.buffer)).toBe(true);
  });

  it("wraps a mammoth exception as PARSE_FAILED", async () => {
    mockMammothExtract.mockRejectedValueOnce(new Error("Not a valid zip"));
    await expect(
      parseResume({
        contentBase64: b64("garbage"),
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName: "broken.docx",
      }),
    ).rejects.toMatchObject({ code: "PARSE_FAILED" });
  });
});

describe("parseResume — UNSUPPORTED_MIME", () => {
  it("rejects legacy .doc (application/msword) with a message asking for .docx or PDF", async () => {
    await expect(
      parseResume({
        contentBase64: b64("anything"),
        mime: "application/msword",
        fileName: "old-resume.doc",
      }),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_MIME",
      message: expect.stringMatching(/save .* as \.docx or PDF/i),
    });
  });
});

describe("parseResume — empty content", () => {
  it("throws EMPTY_CONTENT when base64 decodes to zero bytes", async () => {
    await expect(
      parseResume({ contentBase64: "", mime: "text/plain", fileName: "blank.txt" }),
    ).rejects.toMatchObject({ code: "EMPTY_CONTENT" });
  });

  it("throws EMPTY_CONTENT when the parsed text is whitespace-only", async () => {
    mockPdfParse.mockResolvedValueOnce({ text: "   \n\n   " });
    await expect(
      parseResume({
        contentBase64: b64("fake"),
        mime: "application/pdf",
        fileName: "blank.pdf",
      }),
    ).rejects.toMatchObject({
      code: "EMPTY_CONTENT",
      message: expect.stringMatching(/no extractable text/),
    });
  });
});

describe("parseResume — length cap", () => {
  it("truncates output to MAX_PARSED_LENGTH characters", async () => {
    const giant = "x".repeat(MAX_PARSED_LENGTH + 1000);
    mockPdfParse.mockResolvedValueOnce({ text: giant });
    const result = await parseResume({
      contentBase64: b64("ignored"),
      mime: "application/pdf",
      fileName: "huge.pdf",
    });
    expect(result.length).toBe(MAX_PARSED_LENGTH);
  });
});

describe("ResumeParseError", () => {
  it("is the error class thrown for all known failure modes", () => {
    const e = new ResumeParseError("PARSE_FAILED", "boom");
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe("PARSE_FAILED");
  });
});
