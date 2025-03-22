import { nanoid } from "nanoid";
import {
  getDatabase,
  getUserByEmail,
  hashPassword,
  logAction,
  saveDatabase,
} from "./database";
import { generateRandomString, getCurrentTimestamp } from "./helpers";

// Constants for account recovery
const RECOVERY_TOKENS_KEY = "secure_auth_recovery_tokens";
const TOKEN_EXPIRY_MINUTES = 30;

// Token expiration time (24 hours in milliseconds)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

// Token record interface for localStorage only - different from RecoveryToken in Database
interface LocalRecoveryToken {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

/**
 * Generate a secure recovery token for a user
 * @param email Email of the user requesting recovery
 * @returns Generated token or error message
 */
export const generateRecoveryToken = (
  email: string
): string | { error: string } => {
  try {
    // Check if user exists
    const user = getUserByEmail(email);
    if (!user) {
      // For security reasons, we don't reveal if the email exists
      logAction("recovery_token_requested_nonexistent_user", { email });
      return {
        error:
          "If your email exists in our system, a recovery link will be sent.",
      };
    }

    // Generate a secure random token
    const token = nanoid(32);

    // Current time and expiry
    const now = Date.now();
    const expiresAt = now + TOKEN_EXPIRY_MINUTES * 60 * 1000;

    // Create token record
    const tokenRecord: LocalRecoveryToken = {
      token,
      email,
      createdAt: now,
      expiresAt,
      used: false,
    };

    // Store token in localStorage (in a real app, this would be server-side)
    const existingTokensStr = localStorage.getItem(RECOVERY_TOKENS_KEY);
    const existingTokens: LocalRecoveryToken[] = existingTokensStr
      ? JSON.parse(existingTokensStr)
      : [];

    // Remove any expired or used tokens for this user
    const validTokens = existingTokens.filter(
      (t) => t.email !== email || (t.expiresAt > now && !t.used)
    );

    // Add new token
    validTokens.push(tokenRecord);

    // Save updated tokens
    localStorage.setItem(RECOVERY_TOKENS_KEY, JSON.stringify(validTokens));

    logAction("recovery_token_generated", { email });

    // In a real app, we would email this token to the user
    // For this demo, we return it directly
    return token;
  } catch (error) {
    logAction("recovery_token_generation_error", {
      email,
      error: (error as Error).message,
    });
    return { error: "Failed to generate recovery token" };
  }
};

/**
 * Initiates the password recovery process by creating a recovery token
 * @param email The email address of the user requesting password recovery
 * @returns Promise resolving to the recovery token
 */
export const initiatePasswordRecovery = async (
  email: string
): Promise<string> => {
  const db = getDatabase();

  // Check if the user exists
  const userExists = db.users.some(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
  if (!userExists) {
    throw new Error("User not found");
  }

  // Generate a token
  const token = generateRandomString(32);
  const timestamp = getCurrentTimestamp();

  // Add the token to the database
  if (!db.recoveryTokens) {
    db.recoveryTokens = [];
  }

  // Remove any existing unused tokens for this email
  db.recoveryTokens = db.recoveryTokens.filter(
    (rt) => rt.email.toLowerCase() !== email.toLowerCase() || rt.used
  );

  // Add the new token
  db.recoveryTokens.push({
    token,
    email,
    createdAt: timestamp,
    used: false,
  });

  saveDatabase(db);

  console.log(`Recovery token generated for ${email}`);

  // In a real application, you would send an email with the token
  // For this demo, we'll just return the token
  return token;
};

/**
 * Validates a recovery token
 * @param email The email address of the user
 * @param token The recovery token to validate
 * @returns Promise resolving to a boolean indicating if the token is valid
 */
export const validateRecoveryToken = async (
  email: string,
  token: string
): Promise<boolean> => {
  const db = getDatabase();

  if (!db.recoveryTokens) {
    return false;
  }

  const recoveryToken = db.recoveryTokens.find(
    (rt) =>
      rt.token === token &&
      rt.email.toLowerCase() === email.toLowerCase() &&
      !rt.used
  );

  if (!recoveryToken) {
    return false;
  }

  const currentTime = getCurrentTimestamp();
  const isExpired = currentTime - recoveryToken.createdAt > TOKEN_EXPIRY;

  console.log(`Token validation for ${email}: valid=${!isExpired}`);

  return !isExpired;
};

/**
 * Marks a recovery token as used
 * @param token The token to mark as used
 * @returns Promise resolving to a boolean indicating success
 */
const markTokenAsUsed = async (token: string): Promise<boolean> => {
  const db = getDatabase();

  if (!db.recoveryTokens) {
    return false;
  }

  const tokenIndex = db.recoveryTokens.findIndex(
    (rt) => rt.token === token && !rt.used
  );

  if (tokenIndex === -1) {
    return false;
  }

  db.recoveryTokens[tokenIndex].used = true;
  saveDatabase(db);

  return true;
};

/**
 * Resets a user's password
 * @param email The user's email address
 * @param token The recovery token
 * @param newPassword The new password
 * @returns Promise resolving to a boolean indicating success
 */
export const resetPassword = async (
  email: string,
  token: string,
  newPassword: string
): Promise<boolean> => {
  // Validate the token first
  const isValid = await validateRecoveryToken(email, token);

  if (!isValid) {
    throw new Error("Invalid or expired token");
  }

  const db = getDatabase();

  // Find the user
  const userIndex = db.users.findIndex(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  // Hash the new password
  const { hash, salt } = hashPassword(newPassword);

  // Update the user's password
  db.users[userIndex].passwordHash = hash;
  db.users[userIndex].salt = salt;
  db.users[userIndex].passwordLastChanged = Date.now();

  // Handle password history with type assertion to avoid TS errors
  if (!db.users[userIndex].passwordHistory) {
    db.users[userIndex].passwordHistory = [];
  }

  // TypeScript assertion to avoid "possibly undefined" error
  const passwordHistory = db.users[userIndex].passwordHistory as Array<{
    hash: string;
    salt: string;
    timestamp: number;
  }>;

  // Add new password to history
  passwordHistory.push({
    hash,
    salt,
    timestamp: Date.now(),
  });

  // Limit history size
  const HISTORY_SIZE = 5;
  if (passwordHistory.length > HISTORY_SIZE) {
    db.users[userIndex].passwordHistory = passwordHistory.slice(-HISTORY_SIZE);
  }

  // Reset failed login attempts and unlock account
  db.users[userIndex].failedLoginAttempts = 0;
  db.users[userIndex].lockedUntil = undefined;

  // Mark the token as used
  await markTokenAsUsed(token);

  // Save the database
  saveDatabase(db);

  console.log(`Password reset successful for ${email}`);
  return true;
};

/**
 * Cleans up expired recovery tokens
 * @returns Number of tokens cleaned up
 */
export const cleanupExpiredTokens = (): number => {
  const db = getDatabase();

  if (!db.recoveryTokens) {
    return 0;
  }

  const currentTime = getCurrentTimestamp();
  const initialCount = db.recoveryTokens.length;

  // Filter out expired tokens
  db.recoveryTokens = db.recoveryTokens.filter(
    (token) => currentTime - token.createdAt <= TOKEN_EXPIRY || token.used
  );

  const cleanedCount = initialCount - db.recoveryTokens.length;

  if (cleanedCount > 0) {
    saveDatabase(db);
    console.log(`Cleaned up ${cleanedCount} expired recovery tokens`);
  }

  return cleanedCount;
};
