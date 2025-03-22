import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRecord } from '../utils/database';
import { getAllUsers } from '../utils/databaseHelper';
import { downloadPdf, exportUsersToPdf } from '../utils/exportPdf';
import ExportButton from './ExportButton';

export default function UserList() {
  const auth = useContext(AuthContext);
  const [isExporting, setIsExporting] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  
  useEffect(() => {
    // Fetch users on component mount
    const fetchUsers = async () => {
      try {
        const allUsers = getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const allUsers = getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!users || users.length === 0) {
      alert('No user data available to export');
      return;
    }
    
    setIsExporting(true);
    try {
      const pdfBlob = exportUsersToPdf(users, 'User List Report');
      downloadPdf(pdfBlob, `user-list-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="flex-between">
        <h3 className="admin-subtitle">Registered Users</h3>
        <div className="flex-controls" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            style={{ maxWidth: '200px' }}
            onClick={refreshUsers}
          >
            Refresh Users
          </button>
          <ExportButton 
            onClick={handleExportPdf}
            isLoading={isExporting}
            label="Export to PDF"
          />
        </div>
      </div>
      
      <div className="user-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>MFA Enabled</th>
              <th>Created Date</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user: UserRecord) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.mfaEnabled ? 'Yes' : 'No'}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 