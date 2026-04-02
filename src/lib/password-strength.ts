// lib/password-strength.ts

export type PasswordStrength =
  | "very-weak"
  | "weak"
  | "medium"
  | "strong"
  | "very-strong";

/**
 * Common passwords to check against
 */
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "password123",
  "admin",
  "qwerty",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "password1",
  "123456789",
  "12345678",
  "Password1",
  "password!",
  "Password!",
  "azerty",
  "motdepasse",
];

/**
 * Check if password is in common passwords list
 */
function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "very-weak";
  if (password.length < 8) return "very-weak";
  if (isCommonPassword(password)) return "very-weak";

  let score = 0;
  let bonusScore = 0;

  // Base requirements
  if (password.length >= 8) score++;
  if (password.length >= 12) score++; // Preferred minimum
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>[\]\\`~;+=_-]/.test(password)) score++;

  // Bonus points for extra security
  if (password.length >= 16) bonusScore++;
  if (password.length >= 20) bonusScore++;
  if (
    /[!@#$%^&*(),.?":{}|<>[\]\\`~;+=_-]/.test(password) &&
    /[0-9]/.test(password)
  )
    bonusScore++;
  if (!/(.)\1{2,}/.test(password)) bonusScore++; // No repeated characters
  if (!/^(.*?)(.+)\1$/.test(password)) bonusScore++; // No repetitive patterns

  // Deduct points for weaknesses
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
  if (/^(.*?)(.+)\1$/.test(password)) score--; // Repetitive patterns
  if (/^[a-zA-Z]+$/.test(password)) score--; // Only letters
  if (/^[0-9]+$/.test(password)) score--; // Only numbers

  const totalScore = score + bonusScore;

  if (totalScore < 3) return "very-weak";
  if (totalScore < 5) return "weak";
  if (totalScore < 7) return "medium";
  if (totalScore < 9) return "strong";
  return "very-strong";
}

export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "very-weak":
      return "Très faible";
    case "weak":
      return "Faible";
    case "medium":
      return "Moyen";
    case "strong":
      return "Fort";
    case "very-strong":
      return "Très fort";
  }
}

export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case "very-weak":
      return "bg-red-600";
    case "weak":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
    case "very-strong":
      return "bg-green-600";
  }
}

export function getStrengthWidth(strength: PasswordStrength): string {
  switch (strength) {
    case "very-weak":
      return "20%";
    case "weak":
      return "40%";
    case "medium":
      return "60%";
    case "strong":
      return "80%";
    case "very-strong":
      return "100%";
  }
}

/**
 * Get requirements status for password
 */
export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>[\]\\`~;+=_-]/.test(password),
    notCommon: !isCommonPassword(password),
    noRepeatedChars: !/(.)\1{2,}/.test(password),
  };
}
