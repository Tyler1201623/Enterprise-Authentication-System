import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";

// Define types for login and register results
interface LoginResult {
  success: boolean;
  user?: any;
  error?: string;
  requiresMfa?: boolean;
}

interface RegisterResult {
  success: boolean;
  user?: any;
  error?: string;
}

// Import the interface type directly
interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<RegisterResult>;
  updateUser: (userData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkMfaRequired: (email: string) => Promise<boolean>;
  sendPasswordRecoveryEmail: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  getSessionTimeRemaining?: () => number;
  extendSession?: () => void;
}

/**
 * Hook to access the authentication context
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    console.error("useAuthContext: AuthContext not found");

    // Return a safe fallback to prevent the app from crashing
    return {
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isAdmin: false,
      login: async () => ({ success: false, error: "Auth not initialized" }),
      logout: () => console.error("Auth not initialized"),
      register: async () => ({ success: false, error: "Auth not initialized" }),
      updateUser: async () => console.error("Auth not initialized"),
      refreshUser: async () => console.error("Auth not initialized"),
      checkMfaRequired: async () => false,
      sendPasswordRecoveryEmail: async () => ({
        success: false,
        error: "Auth not initialized",
      }),
      getSessionTimeRemaining: () => 0,
      extendSession: () => console.error("Auth not initialized"),
    };
  }

  // Derive isAuthenticated and isAdmin from user
  return {
    ...context,
    isAuthenticated: !!context.user,
    isAdmin: !!context.user?.isAdmin,
  };
};

// Export as default for backward compatibility
export default useAuthContext;
