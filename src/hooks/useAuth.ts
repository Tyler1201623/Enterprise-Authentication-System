import { useEffect, useState } from "react";
import {
  UserRecord,
  authenticateUser,
  createUser,
  getAllUsers,
  getCurrentUser,
  isAdmin,
  logAction,
  logoutUser,
} from "../utils/database";

interface AuthState {
  user: UserRecord | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
    error: null,
  });

  const [usersList, setUsersList] = useState<UserRecord[] | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    const adminStatus = isAdmin();

    setAuthState({
      user: currentUser,
      isAuthenticated: !!currentUser,
      isAdmin: adminStatus,
      isLoading: false,
      error: null,
    });

    // If admin, load users list
    if (adminStatus) {
      setUsersList(getAllUsers());
    }

    logAction("session_start", { timestamp: new Date().toISOString() });
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = authenticateUser(email, password);

      if (user) {
        const adminStatus = isAdmin();

        setAuthState({
          user,
          isAuthenticated: true,
          isAdmin: adminStatus,
          isLoading: false,
          error: null,
        });

        // If admin, load users list
        if (adminStatus) {
          setUsersList(getAllUsers());
        }

        logAction("login_success", { email });
        return true;
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Invalid email or password",
        }));

        logAction("login_failed", { email, reason: "invalid_credentials" });
        return false;
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "An error occurred during login",
      }));

      logAction("login_error", { email, error: (error as Error).message });
      return false;
    }
  };

  const signup = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = createUser(email, password);

      if (user) {
        logAction("signup_success", { email });
        // Automatically log in after successful signup
        const loginSuccess = await login(email, password);
        return loginSuccess;
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Email already in use",
        }));

        logAction("signup_failed", { email, reason: "email_in_use" });
        return false;
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "An error occurred during signup",
      }));

      logAction("signup_error", { email, error: (error as Error).message });
      return false;
    }
  };

  const logout = () => {
    const email = authState.user?.email;
    logoutUser();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,
    });
    setUsersList(null);

    logAction("logout", { email });
  };

  // Admin function to get all users
  const refreshUsersList = () => {
    if (authState.isAdmin) {
      setUsersList(getAllUsers());
      logAction("admin_refresh_users");
    }
  };

  return {
    ...authState,
    usersList, // Only populated for admin users
    login,
    signup,
    logout,
    refreshUsersList,
  };
}
