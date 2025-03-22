import { useState } from 'react';
import useAuthContext from '../hooks/useAuthContext';
import { makeUserAdmin } from '../utils/database';

export default function AdminSetup() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { user, isAdmin } = useAuthContext();
  
  // Don't show if user is already an admin or not authenticated
  if (isAdmin || !user) {
    return null;
  }

  const handleMakeAdmin = () => {
    // Use the current user's email instead of a hardcoded one
    const email = user.email;
    const success = makeUserAdmin(email);
    
    if (success) {
      setStatus('success');
      setMessage(`Successfully updated your account to admin role. Click below to refresh the dashboard.`);
    } else {
      setStatus('error');
      setMessage(`Failed to update to admin role. Please check the console for more details.`);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '1rem auto' }}>
      <h2 className="card-title">Admin Setup <span style={{ fontSize: '0.8rem', color: '#4285F4' }}>Enterprise System</span></h2>
      
      {status === 'idle' && (
        <>
          <p style={{ marginBottom: '1rem' }}>
            This tool will update your account to have admin privileges.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={handleMakeAdmin}
            style={{ backgroundColor: '#4285F4' }}
          >
            Grant Admin Access
          </button>
        </>
      )}
      
      {status === 'success' && (
        <div className="message success">
          {message}
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem', backgroundColor: '#4285F4' }}
            onClick={() => window.location.reload()}
          >
            Reload Dashboard
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error-message">
          {message}
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem', backgroundColor: '#4285F4' }}
            onClick={() => setStatus('idle')}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
} 