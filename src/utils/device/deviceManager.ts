import { nanoid } from "nanoid";

export interface DeviceInfo {
  id: string;
  name?: string;
  browser: string;
  os: string;
  deviceType: string;
  ip?: string;
  location?: string;
  trusted: boolean;
  lastSeen: number;
  firstSeen: number;
}

// Local storage key for devices
const DEVICE_STORAGE_KEY = "enterprise_auth_devices";
const CURRENT_DEVICE_KEY = "enterprise_auth_current_device";

// Maximum number of devices to remember
const MAX_DEVICES = 10;

/**
 * Get stored devices from local storage
 * @returns Map of stored devices by ID
 */
const getStoredDevices = (): Map<string, DeviceInfo> => {
  try {
    const data = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!data) return new Map();

    const devices: DeviceInfo[] = JSON.parse(data);
    const devicesMap = new Map<string, DeviceInfo>();

    for (const device of devices) {
      devicesMap.set(device.id, device);
    }

    return devicesMap;
  } catch (error) {
    console.error("Error loading devices:", error);
    return new Map();
  }
};

/**
 * Save devices to local storage
 * @param devices Map of devices to save
 */
const saveDevices = (devices: Map<string, DeviceInfo>): void => {
  try {
    const devicesList = Array.from(devices.values());

    // Sort by last seen date (most recent first)
    devicesList.sort((a, b) => b.lastSeen - a.lastSeen);

    // Limit to maximum number of devices
    const limitedDevices = devicesList.slice(0, MAX_DEVICES);

    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(limitedDevices));
  } catch (error) {
    console.error("Error saving devices:", error);
  }
};

/**
 * Detect current browser information
 * @returns Browser and OS information
 */
const detectBrowser = (): {
  browser: string;
  os: string;
  deviceType: string;
} => {
  const userAgent = navigator.userAgent;

  // Detect browser
  let browser = "Unknown";
  if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
  else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
  else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";
  else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1)
    browser = "Internet Explorer";
  else if (userAgent.indexOf("Edge") > -1) browser = "Edge";

  // Detect OS
  let os = "Unknown";
  if (userAgent.indexOf("Windows") > -1) os = "Windows";
  else if (userAgent.indexOf("Mac") > -1) os = "macOS";
  else if (userAgent.indexOf("Linux") > -1) os = "Linux";
  else if (userAgent.indexOf("Android") > -1) os = "Android";
  else if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1)
    os = "iOS";

  // Detect device type
  let deviceType = "Desktop";
  if (userAgent.indexOf("Mobi") > -1) deviceType = "Mobile";
  else if (userAgent.indexOf("Tablet") > -1 || userAgent.indexOf("iPad") > -1)
    deviceType = "Tablet";

  return { browser, os, deviceType };
};

/**
 * Get or create a unique identifier for the current device
 * @returns Device ID
 */
const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = nanoid();
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
};

/**
 * Initialize current device
 * @returns Current device info
 */
const initializeCurrentDevice = (): DeviceInfo => {
  const { browser, os, deviceType } = detectBrowser();
  const now = Date.now();
  const id = getOrCreateDeviceId();

  const currentDevice: DeviceInfo = {
    id,
    browser,
    os,
    deviceType,
    trusted: false,
    lastSeen: now,
    firstSeen: now,
    location: "Unknown Location", // In a real app, this would be detected or provided by the user
  };

  // Save to local storage
  localStorage.setItem(CURRENT_DEVICE_KEY, JSON.stringify(currentDevice));

  // Add to devices list
  const devices = getStoredDevices();

  if (devices.has(id)) {
    // Update existing device
    const existingDevice = devices.get(id)!;
    existingDevice.lastSeen = now;
    existingDevice.browser = browser;
    existingDevice.os = os;
    existingDevice.deviceType = deviceType;
    devices.set(id, existingDevice);
  } else {
    // Add new device
    devices.set(id, currentDevice);
  }

  saveDevices(devices);

  return currentDevice;
};

/**
 * Get the current device
 * @returns Current device info
 */
const getCurrentDevice = (): DeviceInfo => {
  try {
    const stored = localStorage.getItem(CURRENT_DEVICE_KEY);

    if (stored) {
      const device: DeviceInfo = JSON.parse(stored);

      // Update last seen time
      device.lastSeen = Date.now();
      localStorage.setItem(CURRENT_DEVICE_KEY, JSON.stringify(device));

      return device;
    }

    // Initialize if not found
    return initializeCurrentDevice();
  } catch (error) {
    console.error("Error getting current device:", error);
    return initializeCurrentDevice();
  }
};

/**
 * Update the current device information
 * @param updates Updates to apply to the device
 * @returns Updated device info
 */
const updateCurrentDevice = (updates: Partial<DeviceInfo>): DeviceInfo => {
  const currentDevice = getCurrentDevice();

  // Apply updates
  const updatedDevice: DeviceInfo = {
    ...currentDevice,
    ...updates,
    lastSeen: Date.now(), // Always update last seen time
  };

  // Save updates
  localStorage.setItem(CURRENT_DEVICE_KEY, JSON.stringify(updatedDevice));

  // Update in devices list
  const devices = getStoredDevices();
  devices.set(updatedDevice.id, updatedDevice);
  saveDevices(devices);

  return updatedDevice;
};

/**
 * Update the current device's location
 * @param location New location
 * @returns Updated device info
 */
const updateCurrentDeviceLocation = (location: string): DeviceInfo => {
  return updateCurrentDevice({ location });
};

/**
 * Get a device by ID
 * @param deviceId Device ID to find
 * @returns Device info or undefined if not found
 */
const getDevice = (deviceId: string): DeviceInfo | undefined => {
  const devices = getStoredDevices();
  return devices.get(deviceId);
};

/**
 * Get all known devices
 * @returns Array of device info
 */
const getAllDevices = (): DeviceInfo[] => {
  const devices = getStoredDevices();
  return Array.from(devices.values());
};

/**
 * Set device trusted status
 * @param deviceId Device ID
 * @param trusted Whether the device should be trusted
 * @returns Updated device info or undefined if device not found
 */
const setDeviceTrusted = (
  deviceId: string,
  trusted: boolean
): DeviceInfo | undefined => {
  const devices = getStoredDevices();
  const device = devices.get(deviceId);

  if (!device) return undefined;

  device.trusted = trusted;
  device.lastSeen = Date.now();

  devices.set(deviceId, device);
  saveDevices(devices);

  // If this is the current device, update current device too
  if (deviceId === getCurrentDevice().id) {
    localStorage.setItem(CURRENT_DEVICE_KEY, JSON.stringify(device));
  }

  return device;
};

/**
 * Check if a device is trusted
 * @param deviceId Device ID
 * @returns Whether the device is trusted
 */
const isDeviceTrusted = (deviceId: string): boolean => {
  const device = getDevice(deviceId);
  return device ? device.trusted : false;
};

/**
 * Remove a device from the stored devices
 * @param deviceId Device ID to remove
 * @returns Whether the operation was successful
 */
const removeDevice = (deviceId: string): boolean => {
  // Don't allow removing the current device
  if (deviceId === getCurrentDevice().id) {
    return false;
  }

  const devices = getStoredDevices();
  const removed = devices.delete(deviceId);

  if (removed) {
    saveDevices(devices);
  }

  return removed;
};

/**
 * Remove all devices except the current one
 * @returns Number of devices removed
 */
const removeAllOtherDevices = (): number => {
  const currentDeviceId = getCurrentDevice().id;
  const devices = getStoredDevices();

  let removedCount = 0;

  for (const deviceId of devices.keys()) {
    if (deviceId !== currentDeviceId) {
      devices.delete(deviceId);
      removedCount++;
    }
  }

  saveDevices(devices);

  return removedCount;
};

/**
 * Rename a device
 * @param deviceId Device ID
 * @param name New name for the device
 * @returns Updated device info or undefined if device not found
 */
const renameDevice = (
  deviceId: string,
  name: string
): DeviceInfo | undefined => {
  const devices = getStoredDevices();
  const device = devices.get(deviceId);

  if (!device) return undefined;

  device.name = name;
  device.lastSeen = Date.now();

  devices.set(deviceId, device);
  saveDevices(devices);

  // If this is the current device, update current device too
  if (deviceId === getCurrentDevice().id) {
    localStorage.setItem(CURRENT_DEVICE_KEY, JSON.stringify(device));
  }

  return device;
};

// Initialize the device management
const initialize = () => {
  // Initialize the current device when the module is imported
  getCurrentDevice();
};

// Auto-initialize
initialize();

export default {
  getCurrentDevice,
  updateCurrentDevice,
  updateCurrentDeviceLocation,
  getDevice,
  getAllDevices,
  setDeviceTrusted,
  isDeviceTrusted,
  removeDevice,
  removeAllOtherDevices,
  renameDevice,
};
