import deviceManager from "../device/deviceManager";

/**
 * Authentication analytics module for tracking auth-related events
 */

// Event types for tracking authentication activities
export enum AuthEventType {
  LOGIN_ATTEMPT = "login_attempt",
  LOGIN_SUCCESS = "login_success",
  LOGIN_ERROR = "login_error",
  LOGOUT = "logout",
  SIGNUP_ATTEMPT = "signup_attempt",
  SIGNUP_SUCCESS = "signup_success",
  SIGNUP_ERROR = "signup_error",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_COMPLETE = "password_reset_complete",
  MFA_REQUIRED = "mfa_required",
  MFA_SUCCESS = "mfa_success",
  MFA_ERROR = "mfa_error",
  ADMIN_LOGIN = "admin_login",
  PASSWORDLESS_REQUEST = "passwordless_request",
  PASSWORDLESS_SUCCESS = "passwordless_success",
  PASSWORDLESS_ERROR = "passwordless_error",
  SSO_ATTEMPT = "sso_attempt",
  SSO_SUCCESS = "sso_success",
  SSO_ERROR = "sso_error",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  SESSION_EXTENDED = "session_extended",
  SESSION_EXPIRED = "session_expired",
  DEVICE_ADDED = "device_added",
  DEVICE_REMOVED = "device_removed",
  DEVICE_TRUSTED = "device_trusted",
  DEVICE_UNTRUSTED = "device_untrusted",
  MFA_FAILURE = "mfa_failure",
  LOGIN_FAILURE = "login_failure",
  SSO_INITIATED = "sso_initiated",
  SSO_FAILURE = "sso_failure",
  PASSWORDLESS_INITIATED = "passwordless_initiated",
  PASSWORDLESS_FAILURE = "passwordless_failure",
  PASSWORD_CHANGE = "password_change",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  REGISTRATION = "registration",
}

// Event data interface for auth events
export interface AuthEventData {
  userId?: string;
  email?: string;
  success?: boolean;
  error?: string;
  method?: string;
  provider?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  ip?: string;
  location?: string;
}

// Store last events for rate limiting
const lastEvents: Record<string, { time: number; id: string }> = {};

/**
 * Track an authentication-related event
 * @param eventType The type of event to track
 * @param data Additional data for the event
 * @returns The tracked event object
 */
export const trackAuthEvent = (
  eventType: AuthEventType,
  data: Partial<AuthEventData> = {}
): AuthEvent => {
  const timestamp = Date.now();
  const userAgent = navigator.userAgent;
  const currentDevice = deviceManager.getCurrentDevice();

  // Add timestamp if not provided
  if (!data.timestamp) {
    data.timestamp = new Date().toISOString();
  }

  // Check for rate limiting (prevent duplicates)
  const eventKey = `${eventType}-${data.userId || data.email || "anonymous"}`;
  const lastEvent = lastEvents[eventKey];

  if (lastEvent && timestamp - lastEvent.time < 1000) {
    // Return existing event if too frequent (basic rate limiting)
    return {
      type: eventType,
      timestamp: lastEvent.time,
      userId: data.userId,
      deviceId: currentDevice?.id,
      ip: data.ip,
      location: data.location,
      metadata: data.metadata,
      userAgent,
    };
  }

  // Create the event
  const event: AuthEvent = {
    type: eventType,
    timestamp,
    userId: data.userId,
    deviceId: currentDevice?.id,
    ip: data.ip,
    userAgent,
    location: data.location,
    metadata: data.metadata,
  };

  // In production, this would be sent to an analytics service or SIEM system
  console.log(`[Auth Event] ${eventType}`, {
    ...data,
    device: currentDevice?.browser,
    timestamp: new Date(timestamp).toISOString(),
  });

  // Store the last event time for this type
  lastEvents[eventKey] = { time: timestamp, id: crypto.randomUUID() };

  // Store the event locally
  const events = getStoredEvents();
  events.push(event);
  saveEvents(events);

  // Example of monitoring for suspicious activity
  if (eventType.toString().includes("error") && data.error) {
    console.warn(`[Auth Error] ${eventType}: ${data.error}`, {
      email: data.email,
      timestamp: data.timestamp,
    });
  }

  // Example of tracking suspicious activity
  if (
    eventType === AuthEventType.LOGIN_ERROR ||
    eventType === AuthEventType.LOGIN_FAILURE
  ) {
    if (data.metadata?.attempts > 3) {
      console.warn(
        `[Security Alert] Multiple failed login attempts for: ${data.email}`
      );
      trackSuspiciousActivity(
        data.email || "unknown",
        "multiple_failed_logins"
      );
    }
  }

  return event;
};

/**
 * Get auth event history for a user
 * @param userId User ID to get history for
 * @returns Array of auth events
 */
export const getUserAuthHistory = (userId: string): AuthEventData[] => {
  // In a real implementation, this would retrieve data from a database or analytics service
  console.log(`Getting auth history for user ${userId}`);
  return [];
};

/**
 * Clear user analytics data (for privacy regulations like GDPR)
 * @param userId User ID to clear data for
 * @returns Success status
 */
export const clearUserAnalyticsData = async (
  userId: string
): Promise<boolean> => {
  // In a real implementation, this would delete user data from analytics systems
  console.log(`Clearing analytics data for user ${userId}`);
  return true;
};

/**
 * Auth event structure for internal storage
 */
export interface AuthEvent {
  type: AuthEventType;
  userId?: string;
  timestamp: number;
  deviceId?: string;
  ip?: string;
  userAgent?: string;
  location?: string;
  metadata?: Record<string, any>;
  success?: boolean; // Added for compatibility with existing code
  email?: string; // Added for compatibility
}

/**
 * Track a security-related event
 */
export function trackSuspiciousActivity(
  userId: string,
  activityType: string,
  metadata?: any
) {
  console.warn(
    `[Security Alert] Suspicious activity detected for user ${userId}: ${activityType}`
  );

  // Implement your security monitoring here
  // For example, notify security team, log to SIEM system, etc.
  trackAuthEvent(AuthEventType.SUSPICIOUS_ACTIVITY, {
    userId,
    timestamp: new Date().toISOString(),
    metadata: {
      activityType,
      ...metadata,
    },
  });

  // If applicable, lock the account or require additional verification
  if (
    activityType === "multiple_failed_logins" ||
    activityType === "unusual_location"
  ) {
    // lockAccount(userId);
    console.log(`Account security measures initiated for ${userId}`);
  }
}

// Local storage key for analytics
const ANALYTICS_STORAGE_KEY = "auth_analytics_events";

/**
 * Get all stored analytics events
 * @returns Array of all events
 */
const getStoredEvents = (): AuthEvent[] => {
  try {
    const storedData = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (err) {
    console.error("Error retrieving analytics data:", err);
  }
  return [];
};

/**
 * Save events to storage
 * @param events Array of events to save
 */
const saveEvents = (events: AuthEvent[]): void => {
  try {
    // Keep only the last 1000 events to prevent localStorage from getting too full
    const trimmedEvents = events.slice(-1000);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(trimmedEvents));
  } catch (err) {
    console.error("Error saving analytics data:", err);
  }
};

/**
 * Get all analytics events
 * @returns Array of all events
 */
export const getAllEvents = (): AuthEvent[] => {
  return getStoredEvents();
};

/**
 * Get events for a specific user
 * @param userId The user ID to filter by
 * @returns Array of filtered events
 */
export const getUserEvents = (userId: string): AuthEvent[] => {
  const events = getStoredEvents();
  return events.filter((event) => event.userId === userId);
};

/**
 * Get events for a specific device
 * @param deviceId The device ID to filter by
 * @returns Array of filtered events
 */
export const getDeviceEvents = (deviceId: string): AuthEvent[] => {
  const events = getStoredEvents();
  return events.filter((event) => event.deviceId === deviceId);
};

/**
 * Get events of a specific type
 * @param type The event type to filter by
 * @returns Array of filtered events
 */
export const getEventsByType = (type: AuthEventType): AuthEvent[] => {
  const events = getStoredEvents();
  return events.filter((event) => event.type === type);
};

/**
 * Get all failed login/authentication events
 * @returns Array of failed events
 */
export const getFailedEvents = (): AuthEvent[] => {
  const events = getStoredEvents();
  return events.filter((event) => event.success === false);
};

/**
 * Get suspicious activity events
 * @returns Array of suspicious events
 */
export const getSuspiciousEvents = (): AuthEvent[] => {
  const events = getStoredEvents();
  return events.filter(
    (event) =>
      event.type === AuthEventType.SUSPICIOUS_ACTIVITY ||
      (event.type === AuthEventType.LOGIN_FAILURE &&
        event.deviceId &&
        !deviceManager.isDeviceTrusted(event.deviceId))
  );
};

/**
 * Check if a device is trusted
 * @param deviceId Device ID to check
 * @returns Whether the device is trusted
 */
const isDeviceTrusted = (deviceId?: string): boolean => {
  if (!deviceId) return false;
  return deviceManager.isDeviceTrusted(deviceId);
};

/**
 * Clear all analytics events
 * @returns Success status
 */
export const clearAllEvents = (): boolean => {
  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    return true;
  } catch (err) {
    console.error("Error clearing analytics data:", err);
    return false;
  }
};

/**
 * Calculate login success rate for a user or overall
 * @param userId Optional user ID to calculate for
 * @returns Success rate as percentage
 */
export const calculateSuccessRate = (userId?: string): number => {
  const events = userId ? getUserEvents(userId) : getStoredEvents();

  const loginEvents = events.filter(
    (event) =>
      event.type === AuthEventType.LOGIN_SUCCESS ||
      event.type === AuthEventType.LOGIN_FAILURE
  );

  if (loginEvents.length === 0) return 100; // No login attempts yet

  const successEvents = loginEvents.filter(
    (event) => event.type === AuthEventType.LOGIN_SUCCESS
  );
  return (successEvents.length / loginEvents.length) * 100;
};

export default {
  trackAuthEvent,
  getAllEvents,
  getUserEvents,
  getDeviceEvents,
  getEventsByType,
  getFailedEvents,
  getSuspiciousEvents,
  clearAllEvents,
  calculateSuccessRate,
  getEvents: getAllEvents,
  AuthEventType,
};
