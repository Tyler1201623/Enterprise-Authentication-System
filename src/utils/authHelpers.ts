import CryptoJS from "crypto-js";

// Types
export interface User {
  email: string;
  password: string; // This will be stored as hashed
  createdAt: number;
  role: "user" | "admin";
}

export interface UserData {
  users: User[];
  currentUser: User | null;
}

// Constants
const STORAGE_KEY = "users.sb";
const ENCRYPTION_KEY = "hipaa-compliant-encryption-key-2024"; // In production, use environment variables
const SALT = "auth-system-salt-v2"; // In a real app, this should be randomly generated and stored securely
export const ADMIN_EMAIL = "admin@example.com"; // Set this to your admin email

// Helper functions for password handling
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + SALT).toString();
};

export const verifyPassword = (
  password: string,
  hashedPassword: string
): boolean => {
  const hash = CryptoJS.SHA256(password + SALT).toString();
  return hash === hashedPassword;
};

// Encryption helpers
const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("Error decrypting data:", error);
    return null;
  }
};

// User storage functions with encryption
export const getUserData = (): UserData => {
  const encryptedData = localStorage.getItem(STORAGE_KEY);
  if (!encryptedData) {
    return { users: [], currentUser: null };
  }
  try {
    const decryptedData = decryptData(encryptedData);
    return decryptedData || { users: [], currentUser: null };
  } catch (error) {
    console.error("Error parsing user data:", error);
    return { users: [], currentUser: null };
  }
};

export const saveUserData = (userData: UserData): void => {
  const encryptedData = encryptData(userData);
  localStorage.setItem(STORAGE_KEY, encryptedData);
};

export const createUser = (email: string, password: string): User | null => {
  const userData = getUserData();

  // Check if user already exists
  if (userData.users.some((user) => user.email === email)) {
    return null;
  }

  const isAdmin = email === ADMIN_EMAIL;

  const newUser: User = {
    email,
    password: hashPassword(password),
    createdAt: Date.now(),
    role: isAdmin ? "admin" : "user",
  };

  userData.users.push(newUser);
  saveUserData(userData);

  return newUser;
};

export const findUser = (email: string): User | undefined => {
  const userData = getUserData();
  return userData.users.find((user) => user.email === email);
};

export const authenticateUser = (
  email: string,
  password: string
): User | null => {
  const user = findUser(email);

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.password)) {
    return null;
  }

  const userData = getUserData();
  userData.currentUser = user;
  saveUserData(userData);

  return user;
};

export const logoutUser = (): void => {
  const userData = getUserData();
  userData.currentUser = null;
  saveUserData(userData);
};

export const getCurrentUser = (): User | null => {
  const userData = getUserData();
  return userData.currentUser;
};

// Admin functions
export const isAdmin = (): boolean => {
  const currentUser = getCurrentUser();
  return !!currentUser && currentUser.role === "admin";
};

export const getAllUsers = (): User[] | null => {
  if (!isAdmin()) {
    console.error("Unauthorized access attempt to user data");
    return null;
  }

  const userData = getUserData();
  // Return a copy of users with passwords removed for security
  return userData.users.map((user) => ({
    ...user,
    password: "[REDACTED]", // Don't expose hashed passwords even to admin
  }));
};

// For audit logging
export const logAction = (action: string, details?: any): void => {
  const currentUser = getCurrentUser();
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    user: currentUser?.email || "unauthenticated",
    action,
    details,
  };

  // In a real application, this would send to a secure audit log service
  console.log("AUDIT LOG:", logEntry);

  // Store logs locally for demo purposes
  const logs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
  logs.push(logEntry);
  localStorage.setItem("audit_logs", JSON.stringify(logs));
};
