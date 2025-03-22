/**
 * User interface
 * Represents a user in the authentication system
 */
export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: "user" | "admin";
  createdAt: number;
  mfaEnabled: boolean;
  mfaSecret?: string;
  passwordLastChanged?: number;
  passwordExpired?: boolean;
  lastLogin?: number;
}

/**
 * AuditLog interface
 * Represents an entry in the system audit log
 */
export interface AuditLog {
  id?: string;
  timestamp: number;
  action: string;
  userId?: string;
  level: "info" | "warning" | "error";
  details?: Record<string, any>;
}

/**
 * Database interface
 * Represents the structure of the database
 */
export interface Database {
  users: User[];
  auditLogs: AuditLog[];
  recoveryTokens?: RecoveryToken[];
}

/**
 * RecoveryToken interface
 * Represents a password recovery token
 */
export interface RecoveryToken {
  token: string;
  email: string;
  createdAt: number;
  used: boolean;
}

/**
 * MFAStatus interface
 * Represents the status of multi-factor authentication
 */
export interface MFAStatus {
  required: boolean;
  verified: boolean;
}

/**
 * LoginResult interface
 * Represents the result of a login attempt
 */
export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  mfaRequired?: boolean;
}

/**
 * SessionInfo interface
 * Represents information about the current session
 */
export interface SessionInfo {
  expiresAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * PasswordValidationResult interface
 * Represents the result of password validation
 */
export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  strength: number;
}
