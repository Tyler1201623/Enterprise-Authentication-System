import { useState } from 'react';
import useAuthContext from '../hooks/useAuthContext';
import { exportDatabase, importDatabase } from '../utils/database';

export default function DatabaseManager() {
  const { isAdmin } = useAuthContext();
  const [exportedData, setExportedData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  if (!isAdmin) {
    return null;
  }

  const handleExport = () => {
    const data = exportDatabase();
    if (data) {
      setExportedData(data);
      setMessage({ type: 'success', text: 'Database exported successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to export database.' });
    }
  };

  const handleImport = () => {
    if (!importData.trim()) {
      setMessage({ type: 'error', text: 'Please provide valid JSON data to import.' });
      return;
    }

    try {
      // Basic JSON validation
      JSON.parse(importData);
      
      const success = importDatabase(importData);
      if (success) {
        setMessage({ type: 'success', text: 'Database imported successfully!' });
        setImportData('');
      } else {
        setMessage({ type: 'error', text: 'Failed to import database.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid JSON format.' });
    }
  };

  return (
    <div className="admin-content">
      <div className="export-section">
        <h3 className="admin-subtitle">Export Database</h3>
        <button 
          className="btn btn-primary" 
          onClick={handleExport}
          style={{ maxWidth: '200px', marginBottom: '1rem' }}
        >
          Export Database
        </button>
        
        {exportedData && (
          <div className="code-container">
            <pre>{exportedData}</pre>
            <button 
              className="btn btn-primary"
              style={{ maxWidth: '200px', marginTop: '1rem' }}
              onClick={() => {
                navigator.clipboard.writeText(exportedData);
                setMessage({ type: 'success', text: 'Copied to clipboard!' });
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
      
      <div className="import-section" style={{ marginTop: '2rem' }}>
        <h3 className="admin-subtitle">Import Database</h3>
        <p>Paste exported database JSON below. This will merge with existing data.</p>
        
        <textarea 
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          className="code-input"
          rows={10}
          placeholder="Paste database JSON here..."
        />
        
        <button 
          className="btn btn-primary"
          style={{ maxWidth: '200px', marginTop: '1rem' }}
          onClick={handleImport}
        >
          Import Database
        </button>
      </div>
      
      {message && (
        <div className={`message ${message.type}`} style={{ marginTop: '1rem' }}>
          {message.text}
          <button 
            className="close-button"
            onClick={() => setMessage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
} 