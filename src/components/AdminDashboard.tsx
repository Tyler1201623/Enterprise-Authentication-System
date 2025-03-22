import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {
    defaultSystemSettings, getAllLogs, getAllUsers, getLogCount, getSystemSettings,
    logAction,
    saveSystemSettings,
    SystemSettings, UserRecord
} from '../utils/database';
import LoadingSpinner from './LoadingSpinner';

// Simple icon components using emoji
const UserIcon = () => <span role="img" aria-label="User Icon" style={{ marginRight: '8px', fontSize: '18px' }}>👤</span>;
const LogIcon = () => <span role="img" aria-label="Log Icon" style={{ marginRight: '8px', fontSize: '18px' }}>📋</span>;
const SettingsIcon = () => <span role="img" aria-label="Settings Icon" style={{ marginRight: '8px', fontSize: '18px' }}>⚙️</span>;

// Add type for user action
type UserAction = 'edit' | 'delete' | 'resetPassword' | 'toggleMfa';

// Custom virtualized list component with fixed column widths
const VirtualizedUserList: React.FC<any> = React.memo(({ 
  users, 
  height, 
  width,
  onActionClick,
  openDropdownId,
  toggleDropdown
}) => {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
            <th style={{ padding: '14px 10px', textAlign: 'left', width: '30%', fontWeight: '600', color: '#202124' }}>Email</th>
            <th style={{ padding: '14px 10px', textAlign: 'left', width: '12%', fontWeight: '600', color: '#202124' }}>Role</th>
            <th style={{ padding: '14px 10px', textAlign: 'left', width: '12%', fontWeight: '600', color: '#202124' }}>MFA STATUS</th>
            <th style={{ padding: '14px 10px', textAlign: 'left', width: '20%', fontWeight: '600', color: '#202124' }}>Created</th>
            <th style={{ padding: '14px 10px', textAlign: 'left', width: '20%', fontWeight: '600', color: '#202124' }}>Last Login</th>
            <th style={{ padding: '14px 10px', textAlign: 'center', width: '6%', fontWeight: '600', color: '#202124' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: UserRecord) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #e0e0e0', transition: 'background-color 0.2s' }} className="user-row">
              <td style={{ padding: '14px 10px', wordBreak: 'break-all', fontWeight: user.role === 'admin' ? '500' : 'normal' }}>
                {user.email}
                {user.email === 'keeseetyler@yahoo.com' && (
                  <span style={{ marginLeft: '5px', color: '#1a73e8', fontSize: '12px', fontWeight: 'bold' }}>
                    (PRIMARY ADMIN)
                  </span>
                )}
              </td>
              <td style={{ padding: '14px 10px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  backgroundColor: user.role === 'admin' ? '#e8f0fe' : '#f1f3f4',
                  color: user.role === 'admin' ? '#1a73e8' : '#5f6368',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {user.role.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '14px 10px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  backgroundColor: user.mfaEnabled ? '#e6f4ea' : '#fdeded',
                  color: user.mfaEnabled ? '#34a853' : '#d93025',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {user.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </td>
              <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', color: '#5f6368' }}>
                {new Date(user.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', color: user.lastLogin ? '#5f6368' : '#d93025' }}>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
              </td>
              <td style={{ padding: '14px 10px', textAlign: 'center', position: 'relative' }}>
                <button 
                  style={{ 
                    border: 'none', 
                    background: 'none', 
                    cursor: 'pointer', 
                    color: '#1a73e8',
                    fontSize: '20px'
                  }}
                  title="User actions"
                  onClick={(e) => toggleDropdown(user.id, e)}
                >
                  ⋯
                </button>
                
                {openDropdownId === user.id && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      right: '10px', 
                      top: '45px', 
                      backgroundColor: 'white', 
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
                      borderRadius: '8px', 
                      zIndex: 100,
                      width: '180px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <button 
                      style={{ 
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 15px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#202124'
                      }}
                      onClick={() => onActionClick(user.id, 'edit')}
                    >
                      Edit User
                    </button>
                    <button 
                      style={{ 
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 15px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#d93025'
                      }}
                      onClick={() => onActionClick(user.id, 'delete')}
                    >
                      Delete User
                    </button>
                    <button 
                      style={{ 
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 15px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#202124'
                      }}
                      onClick={() => onActionClick(user.id, 'resetPassword')}
                    >
                      Reset Password
                    </button>
                    <button 
                      style={{ 
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 15px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: user.mfaEnabled ? '#d93025' : '#34a853'
                      }}
                      onClick={() => onActionClick(user.id, 'toggleMfa')}
                    >
                      {user.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const DashboardContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
`;

const Title = styled.h2`
  color: #202124;
  margin-bottom: 24px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: none;
  border: 1px solid #eaeaea;
  overflow: hidden;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  background-color: ${props => props.$active ? '#f0f7ff' : 'transparent'};
  color: ${props => props.$active ? '#1a73e8' : '#5f6368'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #1a73e8' : '3px solid transparent'};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 16px;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? '#f0f7ff' : '#f5f5f5'};
  }
`;

const Container = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
  margin-bottom: 24px;
`;

const Button = styled.button`
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  margin-right: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #0d66d0;
  }

  &:disabled {
    background-color: #b3b3b3;
    cursor: not-allowed;
  }
`;

const ExportButton = styled(Button)`
  background-color: #34a853;
  
  &:hover {
    background-color: #2d9249;
  }
  
  &:disabled {
    background-color: #b3b3b3;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
`;

const PageInfo = styled.div`
  font-size: 14px;
  color: #555;
`;

const SearchBox = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 16px;
  width: 300px;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  
  &:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  }
`;

const InfoPanel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const StatCard = styled.div`
  background-color: #ffffff;
  padding: 20px;
  border-radius: 6px;
  flex: 1;
  min-width: 180px;
  box-shadow: none;
  border: 1px solid #eaeaea;
  border-left: 4px solid #1a73e8;
  
  &:nth-child(2) {
    border-left-color: #ea4335;
  }
  
  &:nth-child(3) {
    border-left-color: #fbbc05;
  }
  
  &:nth-child(4) {
    border-left-color: #34a853;
  }
  
  @media (max-width: 768px) {
    min-width: 140px;
  }
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #202124;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
`;

const LogLevel = styled.span<{ level: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.level) {
      case 'error': return '#fdeded';
      case 'warning': return '#fff8e6';
      default: return '#e8f5e9';
    }
  }};
  color: ${props => {
    switch (props.level) {
      case 'error': return '#d32f2f';
      case 'warning': return '#f57c00';
      default: return '#2e7d32';
    }
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
`;

// Fix the table display to ensure all columns are visible
const ResponsiveContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 10px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
`;

// Admin dashboard tabs
type TabType = 'users' | 'logs' | 'settings';

// Define type for component with preload method
interface PreloadableComponent<T = any> extends React.FC<T> {
  preload?: () => Promise<{ default: React.ComponentType<T> }>;
}

// Create a reusable LogTable component for better organization
const LogTable = React.memo(({ logs, loading }: { logs: any[], loading: boolean }) => {
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner message="Loading audit logs..." />
      </LoadingContainer>
    );
  }

  if (!logs.length) {
    return <p>No logs found matching your criteria.</p>;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              Level
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              User ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatTimestamp(log.timestamp)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LogLevel level={log.level}>
                  {log.level.toUpperCase()}
                </LogLevel>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {log.userId || 'System'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {log.action}
                {log.details && (
                  <details className="mt-1">
                    <summary className="text-sm text-blue-600 cursor-pointer">
                      View Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// Formatter function for timestamps
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * AdminDashboard component for administrative functions
 */
const AdminDashboard: PreloadableComponent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLogPage, setCurrentLogPage] = useState(0);
  const [currentUserPage, setCurrentUserPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [tableWidth, setTableWidth] = useState(1160);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  const [levelFilter, setLevelFilter] = useState("all");
  const [logsPerPage, setLogsPerPage] = useState(25);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{success: boolean; count?: number; error?: string} | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);
  // Add state for tracking which dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const usersPerPage = 100;

  // Keep track of whether component is mounted
  const isMounted = useRef(true);
  
  // Handle user action from dropdown
  const handleUserAction = (userId: string, action: UserAction) => {
    // Close the dropdown after action
    setOpenDropdownId(null);
    
    switch (action) {
      case 'edit':
        alert(`Edit user with ID: ${userId}`);
        logAction("admin_edit_user_attempt", { userId });
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this user?')) {
          alert(`Delete user with ID: ${userId}`);
          logAction("admin_delete_user_attempt", { userId });
        }
        break;
      case 'resetPassword':
        if (window.confirm('Are you sure you want to reset this user\'s password?')) {
          alert(`Reset password for user with ID: ${userId}`);
          logAction("admin_reset_password_attempt", { userId });
        }
        break;
      case 'toggleMfa':
        const userToToggle = users.find(u => u.id === userId);
        if (userToToggle) {
          const newStatus = !userToToggle.mfaEnabled;
          alert(`${newStatus ? 'Enable' : 'Disable'} MFA for user with ID: ${userId}`);
          logAction(`admin_${newStatus ? 'enable' : 'disable'}_mfa_attempt`, { userId });
        }
        break;
      default:
        break;
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking from bubbling to document
    setOpenDropdownId(openDropdownId === userId ? null : userId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Apply settings to the system
  const applySystemSettings = useCallback((settings: typeof systemSettings) => {
    // In a production app, these settings would be applied to various systems
    // For this demo, we'll log what would happen
    
    if (settings.requireMfa) {
      console.log("MFA requirement enabled for all new users");
    }
    
    if (settings.enforcePasswordPolicy) {
      console.log("Password complexity policy enforced");
    }
    
    if (settings.enablePasswordless) {
      console.log("Passwordless login enabled");
    }
    
    if (settings.logFailedLogins) {
      console.log("Failed login attempt logging enabled");
    }
    
    if (settings.lockAccountAfterFailures) {
      console.log("Account locking after multiple failures enabled");
    }
    
    console.log(`Session timeout set to ${settings.sessionTimeout} minutes`);
    
    if (settings.enableDetailedLogs) {
      console.log("Detailed activity logging enabled");
    }
    
    if (settings.retainLogsForDays > 365) {
      console.log(`Log retention period set to ${settings.retainLogsForDays} days`);
    }
    
    if (settings.enableAuditAlerts) {
      console.log("Audit alerts for suspicious activity enabled");
    }
    
    if (settings.enableSsoIntegration) {
      console.log("SSO integration enabled");
    }
    
    console.log(`API rate limit set to ${settings.apiRateLimit} requests/minute`);
    
    if (settings.enableAnalytics) {
      console.log("Anonymous usage analytics enabled");
    }
  }, []);
  
  // Create the memoization unconditionally at the top level, before any early returns
  const filteredUsersList = useMemo(() => {
    if (!users.length) return [];
    
    return searchTerm ? users.filter(user => {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(lowerSearch) ||
        (user.name && user.name.toLowerCase().includes(lowerSearch)) ||
        user.role.toLowerCase().includes(lowerSearch)
      );
    }) : users;
  }, [users, searchTerm]);
  
  // Filter logs based on level filter and search term
  const getFilteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm
        ? log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
        
      const matchesLevel = levelFilter === "all" 
        ? true 
        : log.level === levelFilter;
        
      return matchesSearch && matchesLevel;
    });
  }, [logs, searchTerm, levelFilter]);
  
  // Get filtered logs
  const filteredLogs = useMemo(() => getFilteredLogs, [getFilteredLogs]);
  
  // Get paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = currentLogPage * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentLogPage, logsPerPage]);
  
  // Memoize stats section to prevent unnecessary re-renders, but do it at component top level
  // Moving this above conditional return statements to fix the React hooks rule violation
  const statsAdmin = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);
  const statsMfaEnabled = useMemo(() => users.filter(u => u.mfaEnabled).length, [users]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load settings on component mount
  useEffect(() => {
    try {
      const loadedSettings = getSystemSettings();
      setSystemSettings(loadedSettings);
    } catch (error) {
      console.error("Error loading system settings:", error);
    }
  }, []);
  
  // Load initial data on component mount - optimized with parallel data loading
  useEffect(() => {
    const initializeData = async () => {
      if (!isMounted.current) return;
      
      setIsDashboardLoading(true);
      try {
        // Fetch all users immediately
        const allUsers = getAllUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
        setTotalUsers(allUsers.length);
        
        // Always load logs on initialization, even if not on logs tab
        const logCount = getLogCount();
        setTotalLogs(logCount);
        
        // Load the first page of logs regardless of active tab
        const logsPage = getAllLogs(logsPerPage, currentLogPage);
        setLogs(logsPage);
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      } finally {
        if (isMounted.current) {
          setIsDashboardLoading(false);
          setIsLoadingUsers(false);
        }
      }
    };
    
    initializeData();
  }, []);
  
  // Load users when user page changes
  useEffect(() => {
    if (activeTab === 'users' && !isDashboardLoading) {
      loadUsers();
    }
  }, [currentUserPage, activeTab, isDashboardLoading]);
  
  // Load logs when log page changes
  useEffect(() => {
    if (activeTab === 'logs' && !isDashboardLoading) {
      loadLogs();
    }
  }, [currentLogPage, activeTab, isDashboardLoading]);
  
  // Update table width on resize - optimized with debounce
  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.clientWidth);
      }
    };
    
    // Initial width calculation
    updateWidth();
    
    // Debounced resize handler
    const debouncedUpdateWidth = debounce(updateWidth, 200);
    
    window.addEventListener('resize', debouncedUpdateWidth);
    return () => {
      window.removeEventListener('resize', debouncedUpdateWidth);
      debouncedUpdateWidth.cancel();
    };
  }, []);
  
  // Optimize the loading of users with web worker or background processing
  const loadUsers = useCallback(async () => {
    if (isDashboardLoading || !isMounted.current) return;
    
    setIsLoadingUsers(true);
    
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      try {
        if (!isMounted.current) return;
        
        // Load all users at once (removed pagination)
        const allUsers = getAllUsers();
        
        if (isMounted.current) {
          setUsers(allUsers);
          setFilteredUsers(allUsers);
          setTotalUsers(allUsers.length);
          setIsLoadingUsers(false);
        }
      } catch (error) {
        console.error("Error loading users:", error);
        if (isMounted.current) {
          setIsLoadingUsers(false);
        }
      }
    }, 10);
  }, [isDashboardLoading]);
  
  // Optimize the loading of logs
  const loadLogs = useCallback(async () => {
    if (isDashboardLoading || !isMounted.current) return;
    
    setIsLoadingLogs(true);
    
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      try {
        if (!isMounted.current) return;
        
        // In a real app this would be paginated from the server
        const logsPage = getAllLogs(logsPerPage, currentLogPage);
        
        if (isMounted.current) {
          setLogs(logsPage);
          setTotalLogs(getLogCount());
          setIsLoadingLogs(false);
        }
      } catch (error) {
        console.error("Error loading logs:", error);
        if (isMounted.current) {
          setIsLoadingLogs(false);
        }
      }
    }, 10);
  }, [currentLogPage, isDashboardLoading, logsPerPage]);
  
  // Handle search with debounce for better performance
  const debouncedSearch = useMemo(() => 
    debounce((term: string, tab: TabType) => {
      const lowerTerm = term.toLowerCase();
      
      if (tab === 'users') {
        const filtered = users.filter(user => 
          user.email.toLowerCase().includes(lowerTerm) || 
          user.role.toLowerCase().includes(lowerTerm)
        );
        setFilteredUsers(filtered);
      } else if (tab === 'logs') {
        const filtered = logs.filter(log => 
          (log.user && log.user.toLowerCase().includes(lowerTerm)) || 
          log.action.toLowerCase().includes(lowerTerm) ||
          log.level.toLowerCase().includes(lowerTerm)
        );
      }
    }, 300),
    [users, logs]
  );
  
  // Handle search input changes
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term, activeTab);
  }, [activeTab, debouncedSearch]);
  
  const refreshLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const logsPage = getAllLogs(logsPerPage, currentLogPage);
      setLogs(logsPage);
      setTotalLogs(getLogCount());
      setSearchTerm('');
      setLevelFilter('all');
    } catch (err) {
      console.error("Error refreshing logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [currentLogPage, logsPerPage]);

  const handleExport = useCallback(async () => {
    if (!isExporting) {
      setIsExporting(true);
      try {
        const { exportUsersToPdf, exportAuditLogsToPdf } = await import('../utils/exportPdf');
        const { downloadPdf } = await import('../utils/exportPdf');
        
        if (activeTab === 'users') {
          console.log("Exporting users to PDF...");
          if (!filteredUsers || filteredUsers.length === 0) {
            alert("No user data available to export");
            return;
          }
          
          try {
            const pdfBlob = await exportUsersToPdf(filteredUsers);
            const filename = `user-report-${new Date().toISOString().split('T')[0]}.pdf`;
            downloadPdf(pdfBlob, filename);
            alert("Users exported successfully!");
          } catch (error) {
            console.error("Error creating PDF:", error);
            alert(`Failed to export users: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else if (activeTab === 'logs') {
          console.log("Exporting logs to PDF...");
          const logsToExport = filteredLogs;
          if (!logsToExport || logsToExport.length === 0) {
            alert("No log data available to export");
            return;
          }
          
          try {
            const pdfBlob = await exportAuditLogsToPdf(logsToExport);
            const filename = `audit-log-report-${new Date().toISOString().split('T')[0]}.pdf`;
            downloadPdf(pdfBlob, filename);
            alert("Logs exported successfully!");
          } catch (error) {
            console.error("Error creating PDF:", error);
            alert(`Failed to export logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error("Error loading export module:", err);
        alert("Failed to load export module");
      } finally {
        setIsExporting(false);
      }
    }
  }, [activeTab, filteredUsers, filteredLogs, isExporting]);
  
  // Refresh data with improved implementation
  const handleRefresh = useCallback(() => {
    if (activeTab === 'users') {
      setIsLoadingUsers(true);
      try {
        const allUsers = getAllUsers();
        setTotalUsers(allUsers.length);
        
        const paginatedUsers = allUsers.slice(
          currentUserPage * usersPerPage, 
          (currentUserPage + 1) * usersPerPage
        );
        
        setUsers(paginatedUsers);
        setFilteredUsers(paginatedUsers);
        setSearchTerm('');
      } catch (error) {
        console.error("Error refreshing users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    } else if (activeTab === 'logs') {
      setIsLoadingLogs(true);
      try {
        const logsPage = getAllLogs(logsPerPage, currentLogPage);
        setLogs(logsPage);
        setTotalLogs(getLogCount());
        setSearchTerm('');
      } catch (error) {
        console.error("Error refreshing logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    }
  }, [activeTab, currentLogPage, currentUserPage, logsPerPage, usersPerPage]);
  
  // Tab switching - preload data for the new tab
  const handleTabSwitch = useCallback((tab: TabType) => {
    setActiveTab(tab);
    
    if (tab === 'users' && users.length === 0) {
      loadUsers();
    } else if (tab === 'logs' && logs.length === 0) {
      loadLogs();
    }
  }, [loadLogs, loadUsers, logs.length, users.length]);
  
  // Navigate between log pages
  const handleNextLogPage = useCallback(() => {
    if ((currentLogPage + 1) * logsPerPage < totalLogs) {
      setCurrentLogPage(currentLogPage + 1);
    }
  }, [currentLogPage, logsPerPage, totalLogs]);
  
  const handlePrevLogPage = useCallback(() => {
    if (currentLogPage > 0) {
      setCurrentLogPage(currentLogPage - 1);
    }
  }, [currentLogPage]);
  
  // Navigate between user pages
  const handleNextUserPage = useCallback(() => {
    if ((currentUserPage + 1) * usersPerPage < totalUsers) {
      setCurrentUserPage(currentUserPage + 1);
    }
  }, [currentUserPage, totalUsers, usersPerPage]);
  
  const handlePrevUserPage = useCallback(() => {
    if (currentUserPage > 0) {
      setCurrentUserPage(currentUserPage - 1);
    }
  }, [currentUserPage]);
  
  // Handle page change for logs
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < Math.ceil(logs.length / logsPerPage)) {
      setCurrentLogPage(newPage);
    }
  };
  
  // Handle exporting logs to PDF
  const handleExportLogs = async () => {
    try {
      setExportingLogs(true);
      setExportError(null);
      const { exportAuditLogsToPdf, downloadPdf } = await import('../utils/exportPdf');
      
      // Handle the PDF export result properly
      try {
        const pdfBlob = await exportAuditLogsToPdf(filteredLogs);
        const filename = `audit-log-report-${new Date().toISOString().split('T')[0]}.pdf`;
        downloadPdf(pdfBlob, filename);
        setExportResult({
          success: true,
          count: filteredLogs.length
        });
      } catch (error) {
        setExportError(error instanceof Error ? error.message : "Unknown error");
        setExportResult({
          success: false,
          error: error instanceof Error ? error.message : "Export failed"
        });
      }
    } catch (err) {
      console.error("Error exporting logs:", err);
      setExportError(err instanceof Error ? err.message : "Unknown error");
      setExportResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error during export"
      });
    } finally {
      setExportingLogs(false);
    }
  };
  
  // Show a loading spinner for the entire dashboard during initial load
  if (isDashboardLoading) {
    return (
      <DashboardContainer>
        <LoadingContainer style={{ height: '70vh' }}>
          <LoadingSpinner message="Loading Admin Dashboard..." fullPage={false} />
        </LoadingContainer>
      </DashboardContainer>
    );
  }
  
  // Render the stats section inline instead of using useMemo after conditional returns
  const renderStats = (
    <InfoPanel>
      <StatCard>
        <StatValue>{totalUsers}</StatValue>
        <StatLabel>Registered Users</StatLabel>
      </StatCard>
      
      <StatCard>
        <StatValue>{statsAdmin}</StatValue>
        <StatLabel>Administrators</StatLabel>
      </StatCard>
      
      <StatCard>
        <StatValue>{statsMfaEnabled}</StatValue>
        <StatLabel>MFA Enabled</StatLabel>
      </StatCard>
      
      <StatCard>
        <StatValue>{totalLogs}</StatValue>
        <StatLabel>Audit Log Entries</StatLabel>
      </StatCard>
    </InfoPanel>
  );
  
  // Save settings function
  const saveSettings = () => {
    try {
      // Save the settings to database/localStorage
      const success = saveSystemSettings(systemSettings);
      
      if (success) {
        // Apply the settings to the system
        applySystemSettings(systemSettings);
        
        // Add audit log for settings update
        logAction("admin_updated_settings", { settings: systemSettings });
        
        // Show success message
        setSettingsSaved(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          if (isMounted.current) {
            setSettingsSaved(false);
          }
        }, 3000);
      } else {
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };
  
  // Update a single setting
  const updateSetting = (key: keyof SystemSettings, value: boolean | number) => {
    setSystemSettings((prev: SystemSettings) => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Toggle a boolean setting
  const toggleSetting = (setting: keyof SystemSettings) => {
    updateSetting(setting, !systemSettings[setting]);
  };

  // Update a numeric setting
  const updateNumericSetting = (setting: keyof SystemSettings, value: number) => {
    updateSetting(setting, value);
  };
  
  // Reset settings to default values
  const resetSettings = () => {
    setSystemSettings(defaultSystemSettings);
  };
  
  return (
    <DashboardContainer>
      <Title>Enterprise Authentication Admin Dashboard</Title>
      
      {renderStats}
      
      <TabsContainer>
        <TabButton
          $active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
        >
          <UserIcon /> Users
        </TabButton>
        <TabButton
          $active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
        >
          <LogIcon /> Audit Logs
        </TabButton>
        <TabButton
          $active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon /> Settings
        </TabButton>
      </TabsContainer>
      
      {activeTab === 'users' && (
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>User Management</h3>
              <p style={{ fontSize: '15px', color: '#5f6368', marginBottom: '16px', lineHeight: '1.5' }}>
                View and manage all registered user accounts. All created accounts are displayed here for your review.
              </p>
            </div>
            
            <div>
              <ExportButton onClick={handleExport} disabled={isExporting || isLoadingUsers} style={{ marginRight: '10px' }}>
                {isExporting ? 'Exporting...' : 'Export to PDF'}
              </ExportButton>
              <Button onClick={handleRefresh} disabled={isLoadingUsers}>
                {isLoadingUsers ? 'Loading...' : 'Refresh Users'}
              </Button>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <SearchBox 
              type="text"
              placeholder="Search users by email or role..."
              value={searchTerm}
              onChange={handleSearch}
            />
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                marginRight: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '8px 12px', 
                backgroundColor: '#f1f3f4', 
                borderRadius: '4px', 
                fontSize: '14px' 
              }}>
                <span role="img" aria-label="Filter" style={{ marginRight: '6px' }}>🔍</span>
                <span>
                  <strong>{filteredUsersList.length}</strong> {filteredUsersList.length === 1 ? 'user' : 'users'} found
                </span>
              </div>
            </div>
          </div>
          
          {isLoadingUsers ? (
            <LoadingContainer>
              <LoadingSpinner message="Loading users..." />
            </LoadingContainer>
          ) : (
            <ResponsiveContainer ref={tableRef}>
              <VirtualizedUserList 
                users={filteredUsersList}
                height={600}
                width={tableWidth}
                onActionClick={handleUserAction}
                openDropdownId={openDropdownId}
                toggleDropdown={toggleDropdown}
              />
            </ResponsiveContainer>
          )}
        </Container>
      )}
      
      {activeTab === 'logs' && (
        <Container>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Audit Log Management</h2>
                <p className="text-gray-600 text-sm">
                  View and export system activity and security events
                </p>
              </div>
              <div className="flex space-x-2">
                <ExportButton 
                  onClick={handleExportLogs} 
                  disabled={exportingLogs}
                >
                  {exportingLogs ? 'Exporting...' : 'Export PDF'}
                </ExportButton>
                <Button onClick={refreshLogs} disabled={isLoadingLogs}>
                  {isLoadingLogs ? (
                    <span>Refreshing...</span>
                  ) : (
                    <span>Refresh</span>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:items-center">
              <SearchBox
                type="text"
                placeholder="Filter by action or user ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="flex space-x-2 items-center">
                <select 
                  className="form-select rounded border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info Only</option>
                  <option value="warning">Warning Only</option>
                  <option value="error">Error Only</option>
                </select>
                
                <select
                  className="form-select rounded border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={logsPerPage}
                  onChange={(e) => setLogsPerPage(Number(e.target.value))}
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <span>
                Found {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'} matching your criteria
              </span>
            </div>

            <div className="rounded-md border border-gray-200">
              <LogTable logs={paginatedLogs} loading={isLoadingLogs} />
            </div>

            <PaginationControls>
              <Button 
                onClick={() => handlePageChange(currentLogPage - 1)} 
                disabled={currentLogPage === 0}
              >
                Previous
              </Button>
              <PageInfo>
                Page {currentLogPage + 1} of {Math.max(1, Math.ceil(filteredLogs.length / logsPerPage))}
              </PageInfo>
              <Button 
                onClick={() => handlePageChange(currentLogPage + 1)} 
                disabled={currentLogPage >= Math.ceil(filteredLogs.length / logsPerPage) - 1}
              >
                Next
              </Button>
            </PaginationControls>

            {exportResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h4 className="font-medium mb-2">Export Result</h4>
                <div className="text-sm">
                  {exportResult.success ? (
                    <div className="text-green-600">
                      Successfully exported {exportResult.count} logs to PDF.
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error exporting logs: {exportResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Container>
      )}
      
      {activeTab === 'settings' && (
        <Container>
          <div className="flex flex-col space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">System Settings</h2>
              <p className="text-gray-600 text-sm">
                Configure global system settings and security policies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-medium mb-3">User Defaults</h3>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.requireMfa}
                        onChange={() => toggleSetting('requireMfa')}
                      />
                      Require MFA for all new users
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.enforcePasswordPolicy}
                        onChange={() => toggleSetting('enforcePasswordPolicy')}
                      />
                      Enforce password complexity
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.enablePasswordless}
                        onChange={() => toggleSetting('enablePasswordless')}
                      />
                      Enable passwordless login
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-medium mb-3">Security Settings</h3>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.logFailedLogins}
                        onChange={() => toggleSetting('logFailedLogins')}
                      />
                      Log failed login attempts
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.lockAccountAfterFailures}
                        onChange={() => toggleSetting('lockAccountAfterFailures')}
                      />
                      Lock accounts after multiple failures
                    </label>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="font-medium text-sm">Session timeout (minutes):</label>
                    <input 
                      type="number" 
                      min="5" 
                      max="1440"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => updateNumericSetting('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-medium mb-3">Audit & Compliance</h3>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.enableDetailedLogs}
                        onChange={() => toggleSetting('enableDetailedLogs')}
                      />
                      Enable detailed activity logging
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.retainLogsForDays > 365}
                        onChange={() => updateNumericSetting('retainLogsForDays', systemSettings.retainLogsForDays > 365 ? 90 : 366)}
                      />
                      Retain logs for extended period (1 year+)
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.enableAuditAlerts}
                        onChange={() => toggleSetting('enableAuditAlerts')}
                      />
                      Enable audit alerts for suspicious activity
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-medium mb-3">Integration Settings</h3>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.enableSsoIntegration}
                        onChange={() => toggleSetting('enableSsoIntegration')}
                      />
                      Enable SSO integration
                    </label>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="font-medium text-sm">API Rate Limit (requests/min):</label>
                    <input 
                      type="number" 
                      min="10" 
                      max="1000"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={systemSettings.apiRateLimit}
                      onChange={(e) => updateNumericSetting('apiRateLimit', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={systemSettings.enableAnalytics}
                        onChange={() => toggleSetting('enableAnalytics')}
                      />
                      Enable anonymous usage analytics
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={resetSettings} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                Reset to Defaults
              </Button>
              <Button onClick={saveSettings} className="bg-blue-600 text-white hover:bg-blue-700">
                Save All Settings
              </Button>
            </div>
            
            {settingsSaved && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
                Settings saved successfully!
              </div>
            )}
          </div>
        </Container>
      )}
    </DashboardContainer>
  );
};

// Add static preload method to make AdminDashboard a PreloadableComponent
AdminDashboard.preload = () => import('./AdminDashboard');

export default AdminDashboard; 