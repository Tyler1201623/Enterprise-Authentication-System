import { authenticator } from "otplib";

/**
 * Generates a new TOTP secret key
 * @returns A new secret key
 */
export const generateTOTPSecret = (): string => {
  return authenticator.generateSecret();
};

/**
 * Generates a URL for QR code generation
 * @param secret The TOTP secret
 * @param email The user's email
 * @param serviceName The name of the service
 * @returns A URL for QR code generation
 */
export const generateTOTPQRCodeURL = (
  secret: string,
  email: string,
  serviceName: string = "Enterprise Auth"
): string => {
  return authenticator.keyuri(email, serviceName, secret);
};

/**
 * Verifies a TOTP code
 * @param secret The TOTP secret
 * @param token The token to verify
 * @returns Whether the token is valid
 */
export const verifyTOTP = (secret: string, token: string): boolean => {
  try {
    // Configure TOTP settings
    authenticator.options = {
      digits: 6,
      step: 30, // 30 second step
      window: 1, // Allow 1 step before and after
    };

    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
};

/**
 * Calculates the time until the current token expires
 * @returns The number of seconds until expiration
 */
export const getTokenExpirySeconds = (): number => {
  const step = 30; // 30 second step
  const epoch = Math.floor(Date.now() / 1000);
  return step - (epoch % step);
};

/**
 * Generates the current TOTP token for a given secret
 * @param secret The TOTP secret
 * @returns The current token
 */
export const getCurrentToken = (secret: string): string => {
  return authenticator.generate(secret);
};
