// Define the password policy
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // in days
  preventCommonPasswords: boolean;
  preventSequentialChars: boolean;
  preventRepeatedChars: boolean;
  HISTORY_SIZE: number; // Number of previous passwords to store and prevent reuse
}

// Define validation result
export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  strength: number; // 1-5 scale
}

// Default password policy with reasonable security defaults
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8, // Set to exactly 8 characters as requested
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: true,
  requireSpecialChars: false,
  maxAge: 90, // days
  preventCommonPasswords: false,
  preventSequentialChars: false,
  preventRepeatedChars: false,
  HISTORY_SIZE: 5,
};

// List of common passwords to prevent
const COMMON_PASSWORDS = [
  "password",
  "admin",
  "123456",
  "qwerty",
  "welcome",
  "123456789",
  "12345678",
  "12345",
  "1234567890",
  "abc123",
  "football",
  "iloveyou",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "sunshine",
  "princess",
  "superman",
  "batman",
  "master",
  "welcome123",
  "admin123",
  "passw0rd",
];

/**
 * Validates a password against the password policy
 * @param password The password to validate
 * @param policy The password policy to use (defaults to DEFAULT_PASSWORD_POLICY)
 * @returns Validation result with valid flag, message, and strength
 */
export const validatePassword = (
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult => {
  // Check for minimum length
  if (password.length < policy.minLength) {
    return {
      valid: false,
      message: `Password must be at least ${policy.minLength} characters long`,
      strength: 1,
    };
  }

  // Check for required character types
  const hasUppercase = /[A-Z]/.test(password);
  if (policy.requireUppercase && !hasUppercase) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
      strength: getPasswordStrengthLevel(password),
    };
  }

  const hasLowercase = /[a-z]/.test(password);
  if (policy.requireLowercase && !hasLowercase) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
      strength: getPasswordStrengthLevel(password),
    };
  }

  const hasNumbers = /[0-9]/.test(password);
  if (policy.requireNumbers && !hasNumbers) {
    return {
      valid: false,
      message: "Password must contain at least one number",
      strength: getPasswordStrengthLevel(password),
    };
  }

  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  if (policy.requireSpecialChars && !hasSpecialChars) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
      strength: getPasswordStrengthLevel(password),
    };
  }

  // Check for common passwords
  if (
    policy.preventCommonPasswords &&
    COMMON_PASSWORDS.includes(password.toLowerCase())
  ) {
    return {
      valid: false,
      message: "Password is too common and easily guessable",
      strength: 1,
    };
  }

  // Check for sequential characters
  if (policy.preventSequentialChars && hasSequentialChars(password)) {
    return {
      valid: false,
      message: "Password contains sequential characters",
      strength: getPasswordStrengthLevel(password),
    };
  }

  // Check for repeated characters
  if (policy.preventRepeatedChars && hasRepeatedChars(password)) {
    return {
      valid: false,
      message: "Password contains too many repeated characters",
      strength: getPasswordStrengthLevel(password),
    };
  }

  // All checks passed
  return {
    valid: true,
    message: "Password meets all requirements",
    strength: getPasswordStrengthLevel(password),
  };
};

/**
 * Calculates the strength of a password on a scale of 1-5
 * @param password The password to check
 * @returns Password strength score (1=very weak, 5=very strong)
 */
export const getPasswordStrengthLevel = (password: string): number => {
  let score = 0;

  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety bonus
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

  // Add points for variety
  const varietyCount = [
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;
  score += varietyCount / 2;

  // Penalize common patterns
  if (hasSequentialChars(password)) score -= 1;
  if (hasRepeatedChars(password)) score -= 1;
  if (COMMON_PASSWORDS.some((p) => password.toLowerCase().includes(p)))
    score -= 1;

  // Ensure the score is within 1-5 range
  return Math.max(1, Math.min(5, Math.round(score)));
};

/**
 * Checks if a password contains sequential characters like "123" or "abc"
 * @param password The password to check
 * @returns Whether the password has sequential characters
 */
const hasSequentialChars = (password: string): boolean => {
  const sequences = [
    "0123456789",
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  const lowerPassword = password.toLowerCase();

  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const triplet = seq.slice(i, i + 3);
      if (lowerPassword.includes(triplet)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks if a password has too many repeated characters like "aaa" or "111"
 * @param password The password to check
 * @returns Whether the password has too many repeated characters
 */
const hasRepeatedChars = (password: string): boolean => {
  const repeatedPattern = /(.)\1{2,}/; // Matches a character repeated 3+ times
  return repeatedPattern.test(password);
};

/**
 * Checks if a password has expired based on the policy
 * @param lastChanged The timestamp when the password was last changed
 * @param policy The password policy to use
 * @returns Whether the password has expired
 */
export const isPasswordExpired = (
  lastChanged: number,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): boolean => {
  if (policy.maxAge <= 0) return false; // No expiration

  const now = Date.now();
  const diffDays = (now - lastChanged) / (1000 * 60 * 60 * 24);

  return diffDays > policy.maxAge;
};

/**
 * Generates a secure random password that meets the policy requirements
 * @param policy The password policy to use
 * @returns A secure random password
 */
export const generateSecurePassword = (
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): string => {
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // No I, O
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz"; // No l
  const numberChars = "23456789"; // No 0, 1
  const specialChars = "!@#$%^&*_+-=[]{}|:;,.?";

  let allChars = "";
  if (policy.requireUppercase) allChars += uppercaseChars;
  if (policy.requireLowercase) allChars += lowercaseChars;
  if (policy.requireNumbers) allChars += numberChars;
  if (policy.requireSpecialChars) allChars += specialChars;

  // Fallback to ensure we have some characters
  if (allChars.length === 0) {
    allChars = lowercaseChars + numberChars;
  }

  let password = "";

  // Ensure we include at least one of each required char type
  if (policy.requireUppercase) {
    password += uppercaseChars.charAt(
      Math.floor(Math.random() * uppercaseChars.length)
    );
  }
  if (policy.requireLowercase) {
    password += lowercaseChars.charAt(
      Math.floor(Math.random() * lowercaseChars.length)
    );
  }
  if (policy.requireNumbers) {
    password += numberChars.charAt(
      Math.floor(Math.random() * numberChars.length)
    );
  }
  if (policy.requireSpecialChars) {
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length)
    );
  }

  // Add random chars until we reach the minimum length
  while (password.length < policy.minLength) {
    const randomChar = allChars.charAt(
      Math.floor(Math.random() * allChars.length)
    );
    password += randomChar;
  }

  // Shuffle the password to prevent predictable patterns
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

/**
 * Calculates password strength and returns detailed information
 * @param password The password to analyze
 * @returns An object with strength score and feedback
 */
export const calculatePasswordStrength = (
  password: string
): {
  score: number;
  feedback: string;
} => {
  const strength = getPasswordStrengthLevel(password);
  let feedback = "";

  // Provide feedback based on strength
  switch (strength) {
    case 1:
      feedback = "Very weak - easily guessable";
      break;
    case 2:
      feedback = "Weak - consider adding more variety";
      break;
    case 3:
      feedback = "Moderate - but could be stronger";
      break;
    case 4:
      feedback = "Strong - good password";
      break;
    case 5:
      feedback = "Very strong - excellent password";
      break;
    default:
      feedback = "Please enter a password";
  }

  return {
    score: strength,
    feedback,
  };
};
