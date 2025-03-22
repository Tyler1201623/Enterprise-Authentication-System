import { authenticator } from "otplib";
import { decrypt, encrypt } from "./database";

// Default period for TOTP tokens (30 seconds)
authenticator.options = {
  digits: 6,
  period: 30,
  window: 1, // Allow 1 period before/after for clock drift
};

// Generate a new secret for user MFA setup
export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

// Generate a QR code URI for authenticator apps
export function generateQrCodeUri(email: string, secret: string): string {
  return authenticator.keyuri(email, "Tyler Keesee Enterprise Auth", secret);
}

// Verify a TOTP token against a secret
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("MFA verification error:", error);
    return false;
  }
}

// Encrypt and store MFA secret in user record
export function encryptMfaSecret(secret: string): string {
  return encrypt(secret);
}

// Decrypt MFA secret from user record
export function decryptMfaSecret(encryptedSecret: string): string {
  return decrypt(encryptedSecret);
}

// Create a recovery codes array (one-time use backup codes)
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 10 recovery codes, each 10 characters
    let code = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let j = 0; j < 10; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Format as XXXXX-XXXXX for readability
    codes.push(`${code.substring(0, 5)}-${code.substring(5)}`);
  }
  return codes;
}
