import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ensureAdminAccess } from '../utils/database';

/**
 * This component offers a direct route to admin access through URL parameters
 * It can be accessed via: /auth?direct=admin&email=keeseetyler@yahoo.com
 */
const DirectAdminAccess: React.FC = () => {
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const direct = params.get('direct');
    const email = params.get('email');
    
    // Only run if the URL has the right parameters
    if (direct === 'admin' && email === 'keeseetyler@yahoo.com') {
      try {
        setMessage('Creating admin access...');
        
        // Create and login as admin
        const user = ensureAdminAccess(email);
        
        if (user) {
          setMessage('Admin access granted! Redirecting to dashboard...');
          
          // Redirect to dashboard after successful login
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setMessage('Failed to create admin access. Try the emergency admin login button below.');
        }
      } catch (error) {
        setMessage(`Error: ${(error as Error).message}`);
      }
    }
  }, [location, navigate]);
  
  // Only render if the component is active
  if (!message) return null;

  return (
    <div style={{
      margin: '20px auto',
      padding: '15px',
      maxWidth: '500px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #ccc'
    }}>
      <h3>Direct Admin Access</h3>
      <p>{message}</p>
    </div>
  );
};

export default DirectAdminAccess; 