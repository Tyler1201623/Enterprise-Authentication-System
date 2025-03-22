import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuthContext();

  return (
    <header className="header">
      <div className="container">
        <div className="flex-between">
          <h1>
            <Link to="/">Enterprise Authentication</Link>
          </h1>
          
          <nav>
            {user ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/dashboard" className="link">Dashboard</Link>
                <button onClick={logout} className="link">Logout</button>
              </div>
            ) : (
              <Link to="/auth" className="link">Login</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 