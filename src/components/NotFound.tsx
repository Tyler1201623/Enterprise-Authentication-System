import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '2rem 0' }}>
      <div className="card">
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ marginBottom: '2rem' }}>The page you are looking for doesn't exist or has been moved.</p>
        <Link 
          to="/" 
          className="btn btn-primary"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 