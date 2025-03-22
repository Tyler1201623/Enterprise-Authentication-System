import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that controls access to routes based on authentication
 * and optional admin privileges
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, isAdmin, loading: authLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    // Only show loading for a brief moment to avoid flashing
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading indicator while authentication state is being determined
  if (isLoading || authLoading) {
    return (
      <div className="loading-container" style={{ 
        height: '70vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <LoadingSpinner message="Checking authentication..." />
        <p style={{ marginTop: '15px', color: '#666' }}>
          Verifying your credentials...
        </p>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    console.log('Protected route: No user found, redirecting to auth page');
    // Save the current location to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect if admin access is required but the user is not an admin
  if (requireAdmin && !isAdmin) {
    console.warn('Admin access required but user is not an admin - redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Render the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 