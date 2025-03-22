import { logAction, logoutUser } from "./database";

// Constants for session management
const SESSION_ACTIVITY_KEY = "secure_auth_last_activity";
const DEFAULT_TIMEOUT_MINUTES = 15; // HIPAA standard for inactivity timeout
const WARNING_BEFORE_TIMEOUT_MS = 60000; // Show warning 1 minute before timeout
const SESSION_CHECK_INTERVAL_MS = 10000; // Check session every 10 seconds

// Session event handlers
type SessionTimeoutHandlers = {
  onWarning?: (remainingMs: number) => void;
  onTimeout?: () => void;
  onActivity?: () => void;
};

let sessionInterval: number | null = null;
let sessionHandlers: SessionTimeoutHandlers = {};
let sessionTimeoutMinutes = DEFAULT_TIMEOUT_MINUTES;

/**
 * Initialize session management
 * @param timeoutMinutes Minutes of inactivity before session expiration
 * @param handlers Event handlers for session events
 */
export const initializeSessionManagement = (
  timeoutMinutes: number = DEFAULT_TIMEOUT_MINUTES,
  handlers: SessionTimeoutHandlers = {}
): void => {
  // Set timeout duration
  sessionTimeoutMinutes = timeoutMinutes;

  // Store handlers
  sessionHandlers = handlers;

  // Set up activity tracking
  setupActivityTracking();

  // Start session monitoring
  startSessionMonitoring();

  // Record initial activity
  recordUserActivity();

  logAction("session_management_initialized", { timeoutMinutes });
};

/**
 * Stop session management
 */
export const stopSessionManagement = (): void => {
  if (sessionInterval !== null) {
    window.clearInterval(sessionInterval);
    sessionInterval = null;
  }

  // Remove event listeners
  document.removeEventListener("mousemove", handleUserActivity);
  document.removeEventListener("keypress", handleUserActivity);
  document.removeEventListener("click", handleUserActivity);
  document.removeEventListener("scroll", handleUserActivity);
  document.removeEventListener("touchstart", handleUserActivity);

  logAction("session_management_stopped");
};

/**
 * Record user activity to reset the inactivity timer
 */
export const recordUserActivity = (): void => {
  const now = Date.now();
  localStorage.setItem(SESSION_ACTIVITY_KEY, now.toString());

  // Call the onActivity handler if provided
  if (sessionHandlers.onActivity) {
    sessionHandlers.onActivity();
  }
};

/**
 * Get the time remaining in the session in milliseconds
 * @returns Milliseconds until session timeout
 */
export const getSessionTimeRemaining = (): number => {
  const lastActivity = Number(
    localStorage.getItem(SESSION_ACTIVITY_KEY) || Date.now()
  );
  const now = Date.now();
  const elapsedMs = now - lastActivity;
  const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
  return Math.max(0, timeoutMs - elapsedMs);
};

/**
 * Manually extend the session by resetting the activity timestamp
 */
export const extendSession = (): void => {
  recordUserActivity();
  logAction("session_manually_extended");
};

// Private helper functions

function handleUserActivity(): void {
  recordUserActivity();
}

function setupActivityTracking(): void {
  // Track user activity
  document.addEventListener("mousemove", handleUserActivity);
  document.addEventListener("keypress", handleUserActivity);
  document.addEventListener("click", handleUserActivity);
  document.addEventListener("scroll", handleUserActivity);
  document.addEventListener("touchstart", handleUserActivity);
}

function startSessionMonitoring(): void {
  // Stop any existing interval
  if (sessionInterval !== null) {
    window.clearInterval(sessionInterval);
  }

  // Start new monitoring interval
  sessionInterval = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);
}

function checkSession(): void {
  const remainingMs = getSessionTimeRemaining();

  // Handle session timeout if no time remaining
  if (remainingMs <= 0) {
    handleSessionTimeout();
    return;
  }

  // Show warning if session is about to expire
  if (remainingMs <= WARNING_BEFORE_TIMEOUT_MS && sessionHandlers.onWarning) {
    sessionHandlers.onWarning(remainingMs);
  }
}

function handleSessionTimeout(): void {
  // Stop session monitoring
  stopSessionManagement();

  // Log user out
  logoutUser();
  logAction("session_timeout", { reason: "inactivity" });

  // Call the onTimeout handler if provided
  if (sessionHandlers.onTimeout) {
    sessionHandlers.onTimeout();
  }
}
