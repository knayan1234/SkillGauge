import { sessionSetupSchema, MAX_RESUME_BYTES } from "./sessionSetupSchema";

function makeFileList(file: File): ArrayLike<File> {
  return {
    0: file,
    length: 1,
  } as ArrayLike<File>;
}

describe("sessionSetupSchema", () => {
  const validJD =
    "We are hiring a senior software engineer to lead platform work on our backend services and infrastructure.";

  const baseValid = {
    interviewStyle: "mixed" as const,
    difficulty: "medium" as const,
    roleLevel: "mid" as const,
    questionCount: "5" as const,
  };

  it("accepts a valid PDF resume + JD + interview options", () => {
    const file = new File(["%PDF-1.4 hello"], "resume.pdf", {
      type: "application/pdf",
    });
    const result = sessionSetupSchema.safeParse({
      resume: makeFileList(file),
      jobDescription: validJD,
      ...baseValid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong file type", () => {
    const file = new File(["hello"], "resume.txt", { type: "text/plain" });
    const result = sessionSetupSchema.safeParse({
      resume: makeFileList(file),
      jobDescription: validJD,
      ...baseValid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects files larger than 5MB", () => {
    const oversize = new Uint8Array(MAX_RESUME_BYTES + 1);
    const file = new File([oversize], "huge.pdf", {
      type: "application/pdf",
    });
    const result = sessionSetupSchema.safeParse({
      resume: makeFileList(file),
      jobDescription: validJD,
      ...baseValid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects JD shorter than 50 chars", () => {
    const file = new File(["hi"], "resume.pdf", { type: "application/pdf" });
    const result = sessionSetupSchema.safeParse({
      resume: makeFileList(file),
      jobDescription: "too short",
      ...baseValid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported question count", () => {
    const file = new File(["%PDF-1.4 hello"], "resume.pdf", {
      type: "application/pdf",
    });
    const result = sessionSetupSchema.safeParse({
      resume: makeFileList(file),
      jobDescription: validJD,
      ...baseValid,
      questionCount: "4",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid interview style", () => {
    const file = new File(["%PDF-1.4 hello"], "resume.pdf", {
      type: "application/pdf",
    });
    const result = sessionSetupSchema.safeParse({
      resume: makeFileList(file),
      jobDescription: validJD,
      ...baseValid,
      interviewStyle: "coffee-chat",
    });
    expect(result.success).toBe(false);
  });
});
