import { nanoid } from "nanoid";
import { RateLimitAction, rateLimiter } from "../rate-limiting/rateLimiter";

export enum PasswordlessMethod {
  EMAIL_LINK = "email_link",
  EMAIL_CODE = "email_code",
  SMS_CODE = "sms_code",
  PUSH_NOTIFICATION = "push_notification",
  WEBAUTHN = "webauthn",
}

interface PasswordlessRequest {
  id: string;
  identifier: string; // Email or phone number
  method: PasswordlessMethod;
  code?: string;
  token?: string;
  verified: boolean;
  expiresAt: number;
  createdAt: number;
}

// Store for passwordless authentication requests
// In a real implementation, this would be stored in a database
const passwordlessRequests: Map<string, PasswordlessRequest> = new Map();

// Periodic cleanup of expired requests
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, request] of passwordlessRequests.entries()) {
    if (request.expiresAt < now) {
      passwordlessRequests.delete(id);
    }
  }
}, 15 * 60 * 1000); // Run every 15 minutes

/**
 * Initiates a passwordless authentication request
 * @param identifier Email address or phone number
 * @param method Passwordless authentication method
 * @returns The request ID or null if rate limited
 */
export const initiatePasswordlessAuth = (
  identifier: string,
  method: PasswordlessMethod
): { requestId: string | null; error?: string } => {
  // Check rate limits
  const rateLimit = rateLimiter.check(
    RateLimitAction.LOGIN,
    `passwordless:${identifier}`
  );

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.remainingMs / (60 * 1000));
    return {
      requestId: null,
      error: `Too many attempts. Please try again in ${minutes} minutes.`,
    };
  }

  // Create new request
  const requestId = nanoid(32);
  const now = Date.now();

  const request: PasswordlessRequest = {
    id: requestId,
    identifier,
    method,
    verified: false,
    expiresAt: now + 15 * 60 * 1000, // 15 minutes
    createdAt: now,
  };

  // Generate code or token based on method
  switch (method) {
    case PasswordlessMethod.EMAIL_CODE:
    case PasswordlessMethod.SMS_CODE:
      // Generate a 6-digit code
      request.code = Math.floor(100000 + Math.random() * 900000).toString();
      break;

    case PasswordlessMethod.EMAIL_LINK:
      // Generate a secure token
      request.token = nanoid(64);
      break;
  }

  passwordlessRequests.set(requestId, request);

  // In a real implementation, this would send an email or SMS
  // For now, we'll just log the code or token for demonstration
  if (process.env.NODE_ENV === "development") {
    if (request.code) {
      console.log(`[DEV] Passwordless code for ${identifier}: ${request.code}`);
    } else if (request.token) {
      console.log(
        `[DEV] Passwordless token for ${identifier}: ${request.token}`
      );
    }
  }

  return { requestId };
};

/**
 * Verifies a passwordless authentication code
 * @param requestId The request ID
 * @param code The verification code
 * @returns Whether the verification was successful
 */
export const verifyPasswordlessCode = (
  requestId: string,
  code: string
): { success: boolean; error?: string } => {
  const request = passwordlessRequests.get(requestId);

  if (!request) {
    return {
      success: false,
      error: "Invalid or expired request. Please try again.",
    };
  }

  if (request.expiresAt < Date.now()) {
    passwordlessRequests.delete(requestId);
    return {
      success: false,
      error: "Verification code has expired. Please request a new one.",
    };
  }

  // Check rate limits
  const rateLimit = rateLimiter.check(
    RateLimitAction.MFA_ATTEMPT,
    `passwordless:${request.identifier}`
  );

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.remainingMs / (60 * 1000));
    return {
      success: false,
      error: `Too many attempts. Please try again in ${minutes} minutes.`,
    };
  }

  if (request.code !== code) {
    return {
      success: false,
      error: "Invalid verification code. Please try again.",
    };
  }

  // Mark as verified
  request.verified = true;
  passwordlessRequests.set(requestId, request);

  return { success: true };
};

/**
 * Verifies a passwordless authentication token (for email links)
 * @param token The verification token
 * @returns The identifier (email) if verification was successful, or null if not
 */
export const verifyPasswordlessToken = (
  token: string
): { success: boolean; identifier?: string; error?: string } => {
  for (const [id, request] of passwordlessRequests.entries()) {
    if (request.token === token) {
      if (request.expiresAt < Date.now()) {
        passwordlessRequests.delete(id);
        return {
          success: false,
          error: "Link has expired. Please request a new one.",
        };
      }

      // Mark as verified
      request.verified = true;
      passwordlessRequests.set(id, request);

      return {
        success: true,
        identifier: request.identifier,
      };
    }
  }

  return {
    success: false,
    error: "Invalid or expired link. Please request a new one.",
  };
};

/**
 * Gets a verified passwordless request
 * @param requestId The request ID
 * @returns The verified request or null if not found or not verified
 */
export const getVerifiedRequest = (
  requestId: string
): { success: boolean; identifier?: string; error?: string } => {
  const request = passwordlessRequests.get(requestId);

  if (!request) {
    return {
      success: false,
      error: "Invalid or expired request. Please try again.",
    };
  }

  if (!request.verified) {
    return {
      success: false,
      error: "Request has not been verified. Please complete verification.",
    };
  }

  if (request.expiresAt < Date.now()) {
    passwordlessRequests.delete(requestId);
    return {
      success: false,
      error: "Request has expired. Please try again.",
    };
  }

  // Consume the request to prevent replay attacks
  passwordlessRequests.delete(requestId);

  return {
    success: true,
    identifier: request.identifier,
  };
};

/**
 * Completes the passwordless authentication process
 * This would typically create or update a user session
 * @param requestId The request ID
 * @returns Whether the authentication was successful
 */
export const completePasswordlessAuth = (
  requestId: string
): { success: boolean; identifier?: string; error?: string } => {
  const result = getVerifiedRequest(requestId);

  if (!result.success) {
    return result;
  }

  // In a real implementation, this would create a user session
  // Reset rate limits for this identifier
  rateLimiter.reset(RateLimitAction.LOGIN, `passwordless:${result.identifier}`);
  rateLimiter.reset(
    RateLimitAction.MFA_ATTEMPT,
    `passwordless:${result.identifier}`
  );

  return result;
};

/**
 * Cancels a passwordless authentication request
 * @param requestId The request ID
 * @returns Whether the cancellation was successful
 */
export const cancelPasswordlessAuth = (requestId: string): boolean => {
  return passwordlessRequests.delete(requestId);
};

/**
 * Generate a magic link URL for passwordless authentication
 * @param token The verification token
 * @returns The magic link URL
 */
export const generateMagicLinkUrl = (token: string): string => {
  // In a real implementation, this would include your application's URL
  return `${window.location.origin}/auth/verify?token=${token}`;
};

export default {
  initiatePasswordlessAuth,
  verifyPasswordlessCode,
  verifyPasswordlessToken,
  completePasswordlessAuth,
  cancelPasswordlessAuth,
  generateMagicLinkUrl,
  PasswordlessMethod,
};
