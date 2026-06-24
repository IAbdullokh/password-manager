export type PasswordStrength = "Weak" | "Fair" | "Strong";

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return "Weak";

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length >= 10 && score >= 3) return "Strong";
  if (password.length >= 6 && score >= 2) return "Fair";

  return "Weak";
}

export function getPasswordStrengthColor(strength: PasswordStrength): string {
  if (strength === "Weak") return "#f87171";
  if (strength === "Fair") return "#facc15";
  return "#4ade80";
}
