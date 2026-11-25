import { authSchemas, MIN_PASSWORD_LENGTH } from "./authSchema";

function errorsOf(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return (result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]);
}

describe("authSchemas.signIn", () => {
  const schema = authSchemas.signIn;

  it("accepts a valid email and any non-empty password", () => {
    expect(schema.safeParse({ email: "max@beispiel.de", password: "x" }).success).toBe(true);
  });

  it("trims spaces around the email, e.g. from keyboard autocomplete", () => {
    const result = schema.parse({ email: "  max@beispiel.de ", password: "x" });
    expect(result.email).toBe("max@beispiel.de");
  });

  it("asks for the email when it is empty or only spaces", () => {
    for (const email of ["", "   "]) {
      expect(errorsOf(schema.safeParse({ email, password: "x" }))).toEqual([
        ["email", "emailMissing"],
      ]);
    }
  });

  it.each(["max", "max@", "@beispiel.de", "max@beispiel", "max beispiel@de.de"])(
    "rejects the invalid email %p",
    (email) => {
      expect(errorsOf(schema.safeParse({ email, password: "x" }))).toEqual([
        ["email", "emailInvalid"],
      ]);
    },
  );

  it("asks for the password when it is empty", () => {
    expect(errorsOf(schema.safeParse({ email: "max@beispiel.de", password: "" }))).toEqual([
      ["password", "passwordMissing"],
    ]);
  });

  it("does not apply the registration length rule to signing in", () => {
    expect(schema.safeParse({ email: "max@beispiel.de", password: "123" }).success).toBe(true);
  });

  it("reports errors for both fields at once", () => {
    expect(errorsOf(schema.safeParse({ email: "", password: "" }))).toHaveLength(2);
  });
});

describe("authSchemas.signUp", () => {
  const schema = authSchemas.signUp;

  it("requires at least 8 characters, as configured in supabase/config.toml", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it("accepts a password of exactly the minimum length", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(schema.safeParse({ email: "max@beispiel.de", password }).success).toBe(true);
  });

  it("rejects a password one character shorter than the minimum", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(errorsOf(schema.safeParse({ email: "max@beispiel.de", password }))).toEqual([
      ["password", "passwordTooShort"],
    ]);
  });

  it("rejects an empty password with the length code", () => {
    expect(errorsOf(schema.safeParse({ email: "max@beispiel.de", password: "" }))).toEqual([
      ["password", "passwordTooShort"],
    ]);
  });

  it("counts spaces in the password, because passwords are never trimmed", () => {
    const password = " ".repeat(MIN_PASSWORD_LENGTH);
    expect(schema.parse({ email: "max@beispiel.de", password }).password).toBe(password);
  });

  it("uses the same email rules as signing in", () => {
    expect(errorsOf(schema.safeParse({ email: "max@", password: "geheim123" }))).toEqual([
      ["email", "emailInvalid"],
    ]);
  });
});
