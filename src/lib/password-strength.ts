// lib/password-strength.ts

export type PasswordStrength = "weak" | "medium" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  if (password.length < 6) return "weak";

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score < 3) return "weak";
  if (score < 5) return "medium";
  return "strong";
}

export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Faible";
    case "medium":
      return "Moyen";
    case "strong":
      return "Fort";
  }
}

export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
  }
}
