export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Al menos 8 caracteres", test: (p) => p.length >= 8 },
  { id: "lower", label: "Una minuscula", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "Una mayuscula", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "Un numero", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "Un caracter especial (!@#$%&* etc.)",
    test: (p) => /[^a-zA-Z0-9]/.test(p)
  }
];

export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es obligatoria";

  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) =>
    rule.id === "length" ? "al menos 8 caracteres" : rule.label.toLowerCase()
  );

  if (missing.length > 0) {
    return `La contraseña debe incluir ${missing.join(", ")}`;
  }

  return null;
}
