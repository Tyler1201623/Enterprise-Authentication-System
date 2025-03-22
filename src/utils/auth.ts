import { simulateApiCall } from "./api/apiUtils";
import { getUserByEmail } from "./database";

/**
 * Check if MFA is required for a user based on their email
 * @param email User email to check
 * @returns Promise<boolean> - True if MFA is required
 */
export const checkMfaRequired = async (email: string): Promise<boolean> => {
  // Get user record
  const user = getUserByEmail(email);

  // If user has MFA enabled, require it
  if (user?.mfaEnabled) {
    return true;
  }

  return false;
};

/**
 * Verify an MFA token for a user
 * @param email User email
 * @param token MFA token to verify
 * @returns Promise<boolean> - True if token is valid
 */
export const verifyMfaToken = async (
  email: string,
  token: string
): Promise<boolean> => {
  // In a real app, this would verify the token against the user's MFA secret
  // For demo, we'll accept any 6-digit code
  if (token.length !== 6 || !/^\d+$/.test(token)) {
    return false;
  }

  // Simulate API call with 90% success rate
  try {
    return await simulateApiCall(true, 800);
  } catch (error) {
    console.error("MFA verification error:", error);
    return false;
  }
};

export default {
  checkMfaRequired,
  verifyMfaToken,
};
