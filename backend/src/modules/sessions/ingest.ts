/**
 * Resume + JD ingestion pipeline.
 *
 * Until this module shipped, the FE called `FileReader.readAsText(file)` which produced
 * gibberish for binary file types (PDF, DOCX) — the bytes were stored verbatim in Mongo
 * and rendered as binary noise in the sidebar's "View resume" dialog.
 *
 * Now: the FE sends the file as base64 plus a MIME hint, and this module dispatches to
 * the right parser. Returns plain text suitable for inclusion in the LLM prompt and for
 * display in the resume-preview dialog.
 *
 * Supported inputs (by MIME):
 *   - text/* (or any UTF-8 text payload)         → base64-decode + treat as text
 *   - application/pdf                            → pdf-parse extracts text from the PDF
 *   - application/vnd.openxmlformats-…document   → mammoth extracts text from .docx
 *   - application/msword (legacy .doc)           → REJECTED: mammoth only handles .docx;
 *                                                  user should re-export as .docx or PDF
 *   - anything else                              → graceful fallback to UTF-8 decode
 *
 * The parsers are pure-JS (no native build), Windows-friendly, and zero external
 * services. Both libraries are well-maintained but minimal — we wrap them so a future
 * swap (e.g. server-side OCR for scanned PDFs) is contained to this file.
 *
 * Length cap: parsed output is truncated to MAX_PARSED_LENGTH chars so a 200-page CV
 * can't blow up our prompt budget. The cap matches the pre-2c soft cap on raw resumeContent.
 */

import mammoth from "mammoth";
import pdfParse from "pdf-parse";

/** Hard upper bound on parsed text length. Matches the resumeContent zod cap. */
export const MAX_PARSED_LENGTH = 10_000_000;

export interface ParseResumeInput {
  /** Base64-encoded file bytes (FE encodes via FileReader.readAsArrayBuffer + btoa). */
  contentBase64: string;
  /** MIME type from File.type. Used to dispatch to the right parser. */
  mime: string;
  /** Original filename — surfaced in error messages so the user knows which file failed. */
  fileName: string;
}

export class ResumeParseError extends Error {
  constructor(
    public readonly code:
      | "UNSUPPORTED_MIME"
      | "PARSE_FAILED"
      | "EMPTY_CONTENT",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Decode + parse the resume bytes into plain text. Throws ResumeParseError on
 * unsupported MIME types or unparseable content; returns trimmed, length-capped text
 * on success.
 */
export async function parseResume(input: ParseResumeInput): Promise<string> {
  const { contentBase64, mime, fileName } = input;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(contentBase64, "base64");
  } catch (_err) {
    throw new ResumeParseError(
      "PARSE_FAILED",
      `Could not base64-decode ${fileName}.`,
    );
  }
  if (bytes.length === 0) {
    throw new ResumeParseError(
      "EMPTY_CONTENT",
      `${fileName} appears to be empty.`,
    );
  }

  let parsed: string;
  if (mime === "application/pdf") {
    parsed = await parsePdf(bytes, fileName);
  } else if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    parsed = await parseDocx(bytes, fileName);
  } else if (mime === "application/msword") {
    // mammoth only handles the modern XML-based .docx format. Legacy .doc files would
    // need a separate parser (e.g., antiword/textract) which carries native deps.
    // Better to reject clearly and ask the user to re-export.
    throw new ResumeParseError(
      "UNSUPPORTED_MIME",
      `Legacy .doc files aren't supported. Please save ${fileName} as .docx or PDF and upload again.`,
    );
  } else {
    // Default: treat as UTF-8 text. Covers text/plain, text/markdown, etc., and serves
    // as a graceful fallback for unusual MIMEs the FE might surface.
    parsed = bytes.toString("utf8");
  }

  const trimmed = parsed.trim();
  if (trimmed.length === 0) {
    throw new ResumeParseError(
      "EMPTY_CONTENT",
      `${fileName} produced no extractable text.`,
    );
  }
  // Soft cap so a 200-page CV doesn't break prompts. Truncation is fine here — the
  // LLM-side prompt builder also caps to ~4000 chars before sending, so this is a
  // defense against malicious uploads, not a quality knob.
  if (trimmed.length > MAX_PARSED_LENGTH) {
    return trimmed.slice(0, MAX_PARSED_LENGTH);
  }
  return trimmed;
}

async function parsePdf(bytes: Buffer, fileName: string): Promise<string> {
  try {
    const result = await pdfParse(bytes);
    return result.text;
  } catch (err) {
    throw new ResumeParseError(
      "PARSE_FAILED",
      `Could not extract text from ${fileName}: ${err instanceof Error ? err.message : "unknown error"}.`,
    );
  }
}

async function parseDocx(bytes: Buffer, fileName: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return result.value;
  } catch (err) {
    throw new ResumeParseError(
      "PARSE_FAILED",
      `Could not extract text from ${fileName}: ${err instanceof Error ? err.message : "unknown error"}.`,
    );
  }
}
