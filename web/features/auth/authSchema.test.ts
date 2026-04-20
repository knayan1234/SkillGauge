import { authSchema } from "./authSchema";

describe("authSchema", () => {
  it("accepts a valid email and password", () => {
    const result = authSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = authSchema.safeParse({
      email: "  USER@Example.com  ",
      password: "secret123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = authSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 chars", () => {
    const result = authSchema.safeParse({
      email: "user@example.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/at least 6/i);
    }
  });
});
