import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  
  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="card-title">Dashboard</h2>
        
        {user ? (
          <div>
            <p>Welcome, {user.email}!</p>
            <p>You are logged in as: <strong>{isAdmin ? 'Administrator' : 'User'}</strong></p>
            
            <div style={{ marginTop: '2rem' }}>
              <h3>Account Information</h3>
              <p>Email: {user.email}</p>
              <p>Role: {user.role || (isAdmin ? 'admin' : 'user')}</p>
              <p>Account Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</p>
              <p>MFA Enabled: {user.mfaEnabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
        ) : (
          <p>Please log in to view your dashboard.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 