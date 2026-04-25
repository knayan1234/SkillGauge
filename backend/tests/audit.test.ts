import { hashEmailForLog } from "@/shared/audit";

describe("hashEmailForLog", () => {
  it("is deterministic for the same normalized input", () => {
    expect(hashEmailForLog("alice@example.com")).toBe(
      hashEmailForLog("alice@example.com"),
    );
  });

  it("normalizes case + whitespace so equivalent emails share a bucket", () => {
    expect(hashEmailForLog("Alice@Example.com")).toBe(
      hashEmailForLog("  alice@example.com  "),
    );
  });

  it("produces different digests for different emails", () => {
    expect(hashEmailForLog("alice@example.com")).not.toBe(
      hashEmailForLog("bob@example.com"),
    );
  });

  it("returns a 16-char hex prefix and never the raw email", () => {
    const hash = hashEmailForLog("alice@example.com");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(hash).not.toContain("alice");
    expect(hash).not.toContain("@");
  });
});
