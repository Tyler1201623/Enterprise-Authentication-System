declare module "./utils/accountRecovery" {
  export interface RecoveryToken {
    token: string;
    email: string;
    createdAt: number;
    expiresAt: number;
    used: boolean;
  }

  export function generateRecoveryToken(
    email: string
  ): string | { error: string };
  export function initiatePasswordRecovery(email: string): Promise<string>;
  export function validateRecoveryToken(
    email: string,
    token: string
  ): Promise<boolean>;
  export function resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<boolean>;
  export function cleanupExpiredTokens(): Promise<number>;
}
