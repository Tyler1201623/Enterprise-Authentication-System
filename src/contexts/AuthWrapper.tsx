import React, { createContext, useEffect, useState } from 'react';

// Define a simplified user record type
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: "user" | "admin";
  createdAt: number;
  mfaEnabled?: boolean;
}

// Define a simplified auth context type
interface AuthContextType {
  user: UserRecord | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, mfaToken?: string) => Promise<any>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Create a provider component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    try {
      // Simulate loading user from local storage
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mock login function
  const login = async (email: string, password: string, mfaToken?: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      // Here we would normally authenticate against a backend
      const mockUser: UserRecord = {
        id: 'mock-user-id',
        email,
        passwordHash: 'mock-hash',
        salt: 'mock-salt',
        role: email.includes('admin') ? 'admin' : 'user',
        createdAt: Date.now(),
        mfaEnabled: false
      };
      
      setUser(mockUser);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    } catch (err) {
      setError('Authentication failed');
      return { success: false, error: 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  // Create the context value
  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };

