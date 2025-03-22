import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { AuditLog as AuditLogType } from '../types';
import { getAllLogs, getLogCount } from '../utils/databaseHelper';
import { downloadPdf, exportAuditLogsToPdf } from '../utils/exportPdf';
import ExportButton from './ExportButton';

// Define LogRecord interface to match what's expected from database
interface LogRecord {
  id: string;
  timestamp: number;
  level: "info" | "warning" | "error";
  user?: string;
  action: string;
  details?: any;
}

// Mock data for demonstration purposes
const MOCK_LOGS: LogRecord[] = [
  {
    id: "1",
    timestamp: Date.now() - 3600000,
    level: "info",
    user: "user@example.com",
    action: "login",
    details: { ip: "192.168.1.1" }
  },
  {
    id: "2",
    timestamp: Date.now() - 7200000,
    level: "warning",
    user: "admin@example.com",
    action: "failed_login_attempt",
    details: { ip: "192.168.1.2", reason: "Invalid password" }
  },
  {
    id: "3",
    timestamp: Date.now() - 10800000,
    level: "error",
    user: "user@example.com",
    action: "database_error",
    details: { message: "Connection timeout" }
  }
];

const TOTAL_MOCK_LOGS = 100;

// Mock function to simulate loading logs from a database
const mockLoadLogs = (limit: number, page: number): LogRecord[] => {
  return MOCK_LOGS;
};

// Mock function to get log count
const mockGetLogCount = (): number => {
  return TOTAL_MOCK_LOGS;
};

export default function AuditLog() {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.user?.role === 'admin';
  const [auditLogs, setAuditLogs] = useState<LogRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const logsPerPage = 50; // Show 50 logs per page for better performance

  // Load logs when component mounts or page changes
  useEffect(() => {
    if (!isAdmin) return;
    
    const loadAuditLogs = async () => {
      setIsLoading(true);
      try {
        // Use our helper function
        const logs = getAllLogs(logsPerPage, currentPage);
        setAuditLogs(logs);
        setTotalLogs(getLogCount());
      } catch (error) {
        console.error("Error loading audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuditLogs();
  }, [isAdmin, currentPage]);

  const refreshLogs = async () => {
    // Reset to first page when refreshing
    setCurrentPage(0);
    setIsLoading(true);
    
    try {
      const logs = getAllLogs(logsPerPage, 0);
      setAuditLogs(logs);
      setTotalLogs(getLogCount());
    } catch (error) {
      console.error("Error refreshing logs:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const totalPages = Math.ceil(totalLogs / logsPerPage);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExportPdf = async () => {
    if (!auditLogs || auditLogs.length === 0) {
      alert('No audit log data available to export');
      return;
    }
    
    setIsExporting(true);
    try {
      // Convert LogRecord to AuditLogType format
      const formattedLogs: AuditLogType[] = auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        userId: log.user,
        action: log.action,
        details: log.details
      }));
      
      const pdfBlob = exportAuditLogsToPdf(formattedLogs, 'Audit Log Report');
      downloadPdf(pdfBlob, `audit-log-${new Date().toISOString().split('T')[0]}.pdf`);
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
        <h3 className="admin-subtitle">System Audit Logs</h3>
        <div className="flex-controls" style={{ display: 'flex', gap: '10px' }}>
          <span className="log-count">
            Showing {auditLogs.length} of {totalLogs} logs
          </span>
          <button 
            className="btn btn-primary" 
            style={{ maxWidth: '200px' }}
            onClick={refreshLogs}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Logs'}
          </button>
          <ExportButton 
            onClick={handleExportPdf}
            isLoading={isExporting}
            label="Export to PDF"
          />
        </div>
      </div>
      
      <div className="log-table">
        {isLoading && auditLogs.length === 0 ? (
          <div className="loading-indicator">Loading logs...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Level</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.user || 'System'}</td>
                    <td>{log.action}</td>
                    <td>
                      <span className={`log-level ${log.level}`}>
                        {log.level}
                      </span>
                    </td>
                    <td>
                      {log.details ? (
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No logs available</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn-page" 
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 0}
          >
            &laquo; First
          </button>
          <button 
            className="btn-page" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            &lt; Previous
          </button>
          
          <span className="page-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button 
            className="btn-page" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Next &gt;
          </button>
          <button 
            className="btn-page" 
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={currentPage === totalPages - 1}
          >
            Last &raquo;
          </button>
        </div>
      )}
    </div>
  );
} 