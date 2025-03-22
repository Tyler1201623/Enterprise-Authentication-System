/**
 * A simple in-memory rate limiter implementation for client-side authentication attempts
 * In a production application, this would be implemented on the server-side
 * with more robust storage like Redis
 */

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

export enum RateLimitAction {
  LOGIN = "login",
  REGISTRATION = "registration",
  PASSWORD_RESET = "password_reset",
  MFA_ATTEMPT = "mfa_attempt",
  API_CALL = "api_call",
}

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// Default rate limit configurations for different actions
const DEFAULT_RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitOptions> = {
  [RateLimitAction.LOGIN]: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  [RateLimitAction.REGISTRATION]: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  [RateLimitAction.PASSWORD_RESET]: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  [RateLimitAction.MFA_ATTEMPT]: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  [RateLimitAction.API_CALL]: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  },
};

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private options: Record<RateLimitAction, RateLimitOptions>;

  constructor(
    customOptions?: Partial<Record<RateLimitAction, Partial<RateLimitOptions>>>
  ) {
    this.options = { ...DEFAULT_RATE_LIMIT_CONFIGS };

    // Apply custom options if provided
    if (customOptions) {
      Object.entries(customOptions).forEach(([action, opts]) => {
        const actionKey = action as RateLimitAction;
        if (this.options[actionKey] && opts) {
          this.options[actionKey] = {
            ...this.options[actionKey],
            ...opts,
          };
        }
      });
    }

    // Clean up old records periodically
    this.scheduleCleanup();
  }

  /**
   * Generates a key for the rate limit record
   * @param action The action being rate limited
   * @param identifier The identifier (e.g., IP address, user ID, etc.)
   * @returns A unique key for the rate limit record
   */
  private getKey(action: RateLimitAction, identifier: string): string {
    return `${action}:${identifier}`;
  }

  /**
   * Checks if an action should be rate limited
   * @param action The action to check
   * @param identifier The identifier (e.g., IP address, user ID, etc.)
   * @returns An object containing whether the action is allowed and the time remaining until unblocked
   */
  public check(
    action: RateLimitAction,
    identifier: string
  ): { allowed: boolean; remainingMs: number } {
    const key = this.getKey(action, identifier);
    const now = Date.now();
    const config = this.options[action];

    if (!config) {
      return { allowed: true, remainingMs: 0 };
    }

    const record = this.records.get(key);

    // If no record exists, allow the action
    if (!record) {
      this.records.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { allowed: true, remainingMs: 0 };
    }

    // Check if we're in a blocked period after exceeding rate limits
    if (record.count >= config.maxAttempts) {
      const timeSinceLastAttempt = now - record.lastAttempt;

      // If we're still in the block duration, deny the action
      if (timeSinceLastAttempt < config.blockDurationMs) {
        const remainingMs = config.blockDurationMs - timeSinceLastAttempt;
        return { allowed: false, remainingMs };
      }

      // If the block duration has passed, reset the record
      this.records.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { allowed: true, remainingMs: 0 };
    }

    // Check if we're outside the window, and if so, reset the count
    const windowDuration = now - record.firstAttempt;
    if (windowDuration > config.windowMs) {
      this.records.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { allowed: true, remainingMs: 0 };
    }

    // Increment the count and update the last attempt time
    record.count += 1;
    record.lastAttempt = now;
    this.records.set(key, record);

    // If we've now exceeded the rate limit, return false
    if (record.count >= config.maxAttempts) {
      return { allowed: false, remainingMs: config.blockDurationMs };
    }

    // Otherwise, allow the action
    return { allowed: true, remainingMs: 0 };
  }

  /**
   * Resets the rate limit record for a specific action and identifier
   * @param action The action to reset
   * @param identifier The identifier to reset
   * @returns Whether the reset was successful
   */
  public reset(action: RateLimitAction, identifier: string): boolean {
    const key = this.getKey(action, identifier);
    return this.records.delete(key);
  }

  /**
   * Schedules a periodic cleanup of old rate limit records
   */
  private scheduleCleanup(): void {
    // In a browser environment, use setTimeout
    const cleanup = () => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        const actionType = key.split(":")[0] as RateLimitAction;
        const config = this.options[actionType];

        if (!config) continue;

        // If the record is older than the window + block duration, remove it
        const maxAge = config.windowMs + config.blockDurationMs;
        if (now - record.lastAttempt > maxAge) {
          this.records.delete(key);
        }
      }

      // Run cleanup every 5 minutes
      setTimeout(cleanup, 5 * 60 * 1000);
    };

    // Start the cleanup process
    setTimeout(cleanup, 5 * 60 * 1000);
  }

  /**
   * Gets the remaining attempts for a specific action and identifier
   * @param action The action to check
   * @param identifier The identifier to check
   * @returns The number of remaining attempts
   */
  public getRemainingAttempts(
    action: RateLimitAction,
    identifier: string
  ): number {
    const key = this.getKey(action, identifier);
    const record = this.records.get(key);
    const config = this.options[action];

    if (!record || !config) {
      return config?.maxAttempts || 0;
    }

    const remainingAttempts = Math.max(0, config.maxAttempts - record.count);
    return remainingAttempts;
  }

  /**
   * Gets the time remaining until an action is unblocked
   * @param action The action to check
   * @param identifier The identifier to check
   * @returns The time remaining in milliseconds
   */
  public getTimeRemaining(action: RateLimitAction, identifier: string): number {
    const key = this.getKey(action, identifier);
    const record = this.records.get(key);
    const config = this.options[action];

    if (!record || !config) {
      return 0;
    }

    const now = Date.now();

    // If we've exceeded the rate limit, calculate remaining block time
    if (record.count >= config.maxAttempts) {
      const timeSinceLastAttempt = now - record.lastAttempt;
      if (timeSinceLastAttempt < config.blockDurationMs) {
        return config.blockDurationMs - timeSinceLastAttempt;
      }
    }

    // If we're still within the window, calculate when the window resets
    const timeInWindow = now - record.firstAttempt;
    if (timeInWindow < config.windowMs) {
      return config.windowMs - timeInWindow;
    }

    return 0;
  }
}

// Create a singleton instance for use throughout the application
export const rateLimiter = new RateLimiter();

export default rateLimiter;
