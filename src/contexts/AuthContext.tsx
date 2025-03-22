import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AuthEventType, trackAuthEvent } from '../utils/analytics/authAnalytics';
import { simulateApiCall } from '../utils/api/apiUtils';
import { checkMfaRequired } from '../utils/auth';
import {
    UserRecord,
    addAuditLog,
    authenticateUser,
    createUser,
    getCurrentUser,
    logAction,
    updateUser as updateUserInDb
} from '../utils/database';

// Define the user type
interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  role?: string;
  mfaEnabled?: boolean;
  createdAt?: number;
  ssoProvider?: string;
}

// Define login result type
interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  requiresMfa?: boolean;
}

// Define registration result type
interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Define passwordless result type
interface PasswordlessResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

// Auth context type with proper typing for all functions
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (email: string, password: string, name?: string) => Promise<RegisterResult>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkMfaRequired: (email: string) => Promise<boolean>;
  sendPasswordRecoveryEmail: (email: string) => Promise<{success: boolean; error?: string}>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyResetToken: (token: string) => Promise<boolean>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<boolean>;
  getSessionTimeRemaining: () => number;
  extendSession: () => void;
  // Passwordless authentication methods
  startPasswordlessLogin: (email: string, method: string) => Promise<LoginResult>;
  verifyPasswordlessCode: (email: string, code: string, method: string) => Promise<LoginResult>;
  // SSO methods
  getSSOProviders: () => any[];
  initiateSSOLogin: (providerId: string) => Promise<{url: string | null; success?: boolean; error?: string}>;
  handleSSOCallback: (providerId: string, data: any) => Promise<LoginResult>;
};

// Default empty context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => ({ success: false, error: 'Not implemented' }),
  logout: () => {},
  register: async () => ({ success: false, error: 'Not implemented' }),
  updateUser: async () => {},
  refreshUser: async () => {},
  checkMfaRequired: async () => false,
  sendPasswordRecoveryEmail: async () => ({ success: false, error: 'Not implemented' }),
  resetPassword: async () => ({ success: false, message: 'Not implemented' }),
  verifyResetToken: async () => false,
  confirmPasswordReset: async () => false,
  getSessionTimeRemaining: () => 0,
  extendSession: () => {},
  startPasswordlessLogin: async () => ({ success: false, error: 'Not implemented' }),
  verifyPasswordlessCode: async () => ({ success: false, error: 'Not implemented' }),
  getSSOProviders: () => [],
  initiateSSOLogin: async () => ({ url: null, error: 'Not implemented' }),
  handleSSOCallback: async () => ({ success: false, error: 'Not implemented' }),
});

// Session duration in milliseconds (1 hour)
const SESSION_DURATION = 60 * 60 * 1000;

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  
  // Use useRef to store the current auth status for timer callbacks
  const userRef = useRef<User | null>(null);
  const sessionExpiryRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user;
    sessionExpiryRef.current = sessionExpiry;
  }, [user, sessionExpiry]);

  // Define logout function with useCallback to avoid circular dependencies
  const logout = useCallback(() => {
    console.log('Logging out user...');
    // Track logout event if user exists
    if (userRef.current) {
      trackAuthEvent(AuthEventType.LOGOUT, {
        userId: userRef.current.id,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Clear user data
    setUser(null);
    setSessionExpiry(null);
    
    // Clear any stored tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('sessionExpiry');
    
    console.log('Logout completed');
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    console.log('Initializing auth state from localStorage');
    const storedSessionExpiry = localStorage.getItem('sessionExpiry');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedSessionExpiry && storedUser) {
      const expiryTime = parseInt(storedSessionExpiry, 10);
      
      // Check if session is still valid
      if (expiryTime > Date.now()) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setSessionExpiry(expiryTime);
          console.log('Restored user session from localStorage');
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          localStorage.removeItem('authUser');
          localStorage.removeItem('sessionExpiry');
        }
      } else {
        // Session expired
        console.log('Stored session expired, cleaning up');
        localStorage.removeItem('authUser');
        localStorage.removeItem('sessionExpiry');
      }
    }
  }, []);

  // Check for session expiry
  useEffect(() => {
    console.log('Setting up session expiry timer');
    
    // Function to check if session is expired
    const checkExpiry = () => {
      const currentExpiry = sessionExpiryRef.current;
      const currentUser = userRef.current;
      
      console.log('Checking session expiry:', currentExpiry, 'Current time:', Date.now());
      
      if (currentUser && currentExpiry && currentExpiry < Date.now()) {
        console.log('Session expired, logging out');
        logout();
        return true;
      }
      return false;
    };
    
    // Initial check
    checkExpiry();
    
    // Set up interval to check session expiry
    const interval = setInterval(checkExpiry, 60000); // Check every minute
    
    return () => {
      clearInterval(interval);
    };
  }, [logout]);

  // Function to check if session is expired
  const checkSessionExpiry = useCallback(() => {
    if (sessionExpiry && sessionExpiry < Date.now()) {
      logout();
      return true;
    }
    return false;
  }, [sessionExpiry, logout]);

  // Login function
  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    setError(null);

    // Track login attempt
    trackAuthEvent(AuthEventType.LOGIN_ATTEMPT, {
      email,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check if MFA is required but not provided
      if (await checkMfaRequired(email) && !password) {
        console.log('MFA is required for this account');
        setLoading(false);
        return {
          success: false,
          error: 'MFA required',
          requiresMfa: true
        };
      }

      // Authenticate using the database
      const userRecord = authenticateUser(email, password);
      
      if (!userRecord) {
        setLoading(false);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }
      
      // Convert user record to context user
      const authUser = convertUserRecord(userRecord);
      
      console.log('AuthProvider: Login successful, user:', authUser);
      setUser(authUser);
      setSessionExpiry(Date.now() + SESSION_DURATION); // 1 hour from now
      
      // Log the successful login
      logAction('user_login', { email: authUser.email, userId: authUser.id });
      
      // Track successful login
      if (authUser.isAdmin) {
        trackAuthEvent(AuthEventType.ADMIN_LOGIN, {
          userId: authUser.id,
          timestamp: new Date().toISOString(),
        });
      } else {
        trackAuthEvent(AuthEventType.LOGIN_SUCCESS, {
          userId: authUser.id,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Store in localStorage
      localStorage.setItem('authToken', 'demo-token-' + authUser.id);
      localStorage.setItem('sessionExpiry', (Date.now() + SESSION_DURATION).toString());
      localStorage.setItem('authUser', JSON.stringify(authUser));
      
      setLoading(false);
      
      return {
        success: true,
        user: authUser
      };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      setLoading(false);

      // Track login error
      trackAuthEvent(AuthEventType.LOGIN_ERROR, {
        email,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Register function
  const register = async (email: string, password: string, name?: string): Promise<RegisterResult> => {
    console.log(`AuthProvider: Register attempt for ${email}`);
    setError(null);
    setLoading(true);
    
    try {
      // Create user in the database
      const userRecord = createUser(email, password);
      
      if (!userRecord) {
        setLoading(false);
        return {
          success: false,
          error: 'Registration failed. Please try again.'
        };
      }
      
      // If name was provided, update the user record
      if (name) {
        // Update user metadata to include name
        const updatedRecord: Partial<UserRecord> = {
          name: name,
          metadata: { ...userRecord.metadata, displayName: name }
        };
        updateUserInDb(userRecord.id, updatedRecord);
      }
      
      // Convert user record to context user
      const authUser = convertUserRecord(userRecord);
      
      console.log('AuthProvider: Registration successful, user:', authUser);
      setUser(authUser);
      setSessionExpiry(Date.now() + SESSION_DURATION); // 1 hour from now
      
      // Log the registration
      logAction('user_register', { email: authUser.email, userId: authUser.id });
      
      // Track successful signup
      trackAuthEvent(AuthEventType.SIGNUP_SUCCESS, {
        userId: authUser.id,
        timestamp: new Date().toISOString(),
      });
      
      // Store in localStorage
      localStorage.setItem('authToken', 'demo-token-' + authUser.id);
      localStorage.setItem('sessionExpiry', (Date.now() + SESSION_DURATION).toString());
      localStorage.setItem('authUser', JSON.stringify(authUser));
      
      setLoading(false);
      
      return {
        success: true,
        user: authUser
      };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = 'Registration failed. Please try again later.';
      setError(errorMessage);
      setLoading(false);

      // Track signup error
      trackAuthEvent(AuthEventType.SIGNUP_ERROR, {
        email,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    console.log('Updating user:', userData);
    
    try {
      // Convert to database format and update
      const dbUserData: Partial<UserRecord> = {
        ...userData,
        role: userData.isAdmin ? 'admin' : 'user'
      };
      
      // Update in database
      const updatedUserRecord = await updateUserInDb(user.id, dbUserData);
      
      if (updatedUserRecord) {
        const updatedUser = convertUserRecord(updatedUserRecord);
        setUser(updatedUser);
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    console.log('Refreshing user data');
    try {
      const currentUserRecord = getCurrentUser();
      if (currentUserRecord) {
        setUser(convertUserRecord(currentUserRecord));
      } else {
        // No current user in database
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  // Password recovery functionality
  const sendPasswordRecoveryEmail = async (email: string) => {
    console.log('Password recovery requested for:', email);
    try {
      // In a real implementation, this would generate a token,
      // store it securely, and send an email with a reset link
      
      // For demo purposes, we'll just log the action and return success
      const token = Math.random().toString(36).substring(2, 15);
      console.log(`Recovery token for ${email}: ${token}`);
      
      addAuditLog({
        timestamp: Date.now(),
        action: 'password_recovery_requested',
        level: 'info',
        details: { email }
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error sending recovery email:', err);
      return { 
        success: false, 
        error: 'Failed to send recovery email. Please try again later.' 
      };
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);

    // Track password reset attempt
    trackAuthEvent(AuthEventType.PASSWORD_RESET_REQUEST, {
      email,
      timestamp: new Date().toISOString(),
    });

    try {
      // Simulate API call with 1s delay
      const result = await simulateApiCall<{ success: boolean; message: string }>(
        {
          success: true,
          message: 'Password reset email sent. Please check your inbox.',
        },
        1000
      );

      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Verify reset token
  const verifyResetToken = async (token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call with 1s delay
      const result = await simulateApiCall<boolean>(true, 1000);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (token: string, newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    // Track password reset completion
    trackAuthEvent(AuthEventType.PASSWORD_RESET_COMPLETE, {
      timestamp: new Date().toISOString(),
    });

    try {
      // Simulate API call with 1s delay
      const result = await simulateApiCall<boolean>(true, 1000);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  // Passwordless authentication methods
  const startPasswordlessLogin = async (email: string, method: string): Promise<LoginResult> => {
    console.log(`Initiating passwordless login for ${email} using ${method}`);
    
    try {
      // In a real implementation, this would send an email or SMS
      // For demo purposes, we'll simulate a successful request
      
      // Track the event
      trackAuthEvent(AuthEventType.PASSWORDLESS_INITIATED, {
        email,
        method,
        timestamp: new Date().toISOString()
      });
      
      // Return success with a mock requestId
      // In a real implementation, this would be tracked serverside
      return {
        success: true,
        error: undefined
      };
    } catch (err) {
      console.error('Passwordless initiation error:', err);
      
      // Track the error
      trackAuthEvent(AuthEventType.PASSWORDLESS_ERROR, {
        email,
        method,
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: 'Failed to initiate passwordless login'
      };
    }
  };

  const verifyPasswordlessCode = async (email: string, code: string, method: string): Promise<LoginResult> => {
    // Basic format check for the code
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Invalid verification code format');
      return {
        success: false,
        error: 'Invalid verification code format',
      };
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate successful verification (in a real app, this would validate against the server)
      const result = await simulateApiCall<LoginResult>(
        {
          success: true,
          user: {
            id: uuidv4(),
            email,
            name: 'Demo User',
            isAdmin: false,
            role: 'user',
          },
        },
        1500
      );

      if (result.success && result.user) {
        // Set session expiry
        const expiry = Date.now() + SESSION_DURATION;
        setSessionExpiry(expiry);
        setUser(result.user);

        // Store in localStorage
        localStorage.setItem('authToken', 'demo-token-' + result.user.id);
        localStorage.setItem('sessionExpiry', expiry.toString());
        localStorage.setItem('authUser', JSON.stringify(result.user));

        // Track successful passwordless login
        trackAuthEvent(AuthEventType.PASSWORDLESS_SUCCESS, {
          userId: result.user.id,
          method,
          timestamp: new Date().toISOString(),
        });
      }

      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);

      // Track passwordless verification error
      trackAuthEvent(AuthEventType.PASSWORDLESS_ERROR, {
        email,
        method,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // SSO methods
  const getSSOProviders = () => {
    // Mock SSO providers for demo purposes
    return [
      {
        id: "google",
        name: "Google Workspace",
        type: "oauth2",
        enabled: true,
        metadata: { clientId: "mock-client-id" }
      },
      {
        id: "microsoft",
        name: "Microsoft Azure AD",
        type: "oidc",
        enabled: true,
        metadata: { clientId: "mock-client-id" }
      },
      {
        id: "okta",
        name: "Okta SSO",
        type: "saml",
        enabled: true,
        metadata: { entityId: "mock-entity-id" }
      },
      {
        id: "github",
        name: "GitHub",
        type: "oauth2",
        enabled: true,
        metadata: { clientId: "mock-client-id" }
      }
    ];
  };

  const initiateSSOLogin = async (providerId: string) => {
    try {
      console.log(`Initiating SSO login for provider: ${providerId}`);
      
      // In a real app, this would redirect to the SSO provider
      // For demo, we'll simulate a successful login after a short delay
      
      // Import database functions
      const { addAuditLog } = await import('../utils/database');
      
      // Record the SSO initiation in the audit log
      await addAuditLog({
        timestamp: Date.now(),
        action: 'sso_initiated',
        level: 'info',
        details: {
          provider: providerId
        }
      });
      
      // Track the login attempt
      trackAuthEvent(AuthEventType.SSO_INITIATED, {
        provider: providerId,
        timestamp: new Date().toISOString()
      });
      
      // Simulate a redirect URL (in a real app, this would be the provider's auth URL)
      const redirectUrl = null;
      
      // In the demo, we'll simulate a successful login
      // In a real app, we'd return the URL and redirect the user
      setTimeout(() => {
        // Simulate a callback with mock user data
        const mockData = {
          id: crypto.randomUUID(),
          email: `demo_${providerId.toLowerCase()}@example.com`,
          name: `Demo ${providerId} User`,
        };
        
        // Process the mock callback
        handleSSOCallback(providerId, mockData);
      }, 1500);
      
      return {
        url: redirectUrl,
        success: true
      };
    } catch (error) {
      console.error("SSO initiation error:", error);
      
      // Track the failed attempt
      trackAuthEvent(AuthEventType.SSO_FAILURE, {
        provider: providerId,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
      
      return {
        url: null,
        error: "Failed to initiate SSO login",
        success: false
      };
    }
  };

  const handleSSOCallback = async (providerId: string, data: any): Promise<LoginResult> => {
    try {
      // In a real implementation, this would validate the token/code from the SSO callback
      console.log(`Handling SSO callback for provider: ${providerId}`, data);
      
      // Import database functions
      const { createUser, updateUser, addAuditLog } = await import('../utils/database');
      
      // For demo purposes, we'll create a user from the data
      // In production, we'd validate the token and get user info from the provider
      const userId = data.id || crypto.randomUUID();
      const mockUser: User = {
        id: userId,
        email: data.email,
        name: data.name || `${providerId} User`,
        isAdmin: false,
        role: "user",
        mfaEnabled: false,
        createdAt: Date.now(),
        ssoProvider: providerId
      };
      
      // Create or update the user in our database
      const demoPassword = `sso-${crypto.randomUUID().slice(0, 8)}`;
      let userRecord = await createUser(data.email, demoPassword);
      
      if (userRecord) {
        // Update the user record with SSO info
        await updateUser(userRecord.id, {
          name: data.name || `${providerId} User`,
          metadata: {
            ssoProvider: providerId,
            lastSsoLogin: Date.now()
          }
        });
      }
      
      // Add audit log entry
      await addAuditLog({
        timestamp: Date.now(),
        action: 'sso_login',
        userId: userId,
        level: 'info',
        details: {
          provider: providerId,
          email: data.email
        }
      });
      
      // Save the user in state
      setUser(mockUser);
      
      // Set session data
      localStorage.setItem(
        'auth_session',
        JSON.stringify({
          id: mockUser.id,
          expiresAt: Date.now() + SESSION_DURATION,
          lastActivity: Date.now()
        })
      );
      
      // Track the successful login with analytics
      trackAuthEvent(AuthEventType.SSO_SUCCESS, {
        userId: mockUser.id,
        email: mockUser.email,
        provider: providerId,
        timestamp: new Date().toISOString()
      });
      
      // Return success
      return {
        success: true,
        user: mockUser
      };
    } catch (err) {
      console.error("SSO callback error:", err);
      
      // Track the failed login
      trackAuthEvent(AuthEventType.SSO_ERROR, {
        provider: providerId,
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: "Failed to authenticate with SSO provider"
      };
    }
  };

  // Session timeout functions
  const getSessionTimeRemaining = () => {
    if (!sessionExpiry) return 0;
    const remaining = Math.max(0, sessionExpiry - Date.now());
    return Math.floor(remaining / 1000); // Convert to seconds
  };

  const extendSession = () => {
    console.log('Session extended');
    // Extend the session by 1 hour
    setSessionExpiry(Date.now() + SESSION_DURATION);
  };

  // Calculate derived states
  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin || false;

  // Combined auth context value
  const authContextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    logout,
    register,
    updateUser,
    refreshUser,
    checkMfaRequired,
    sendPasswordRecoveryEmail,
    resetPassword,
    verifyResetToken,
    confirmPasswordReset,
    getSessionTimeRemaining,
    extendSession,
    startPasswordlessLogin,
    verifyPasswordlessCode,
    getSSOProviders,
    initiateSSOLogin,
    handleSSOCallback
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;

// Convert database user record to auth context user
const convertUserRecord = (userRecord: UserRecord): User => {
  return {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name || userRecord.email.split('@')[0],
    isAdmin: userRecord.role === 'admin',
    role: userRecord.role,
    mfaEnabled: userRecord.mfaEnabled,
    createdAt: userRecord.createdAt,
    ssoProvider: userRecord.metadata?.ssoProvider
  };
}; 