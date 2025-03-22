import React, { useEffect } from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import AuthFormSwitcher from './components/AuthFormSwitcher';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import ForgotPassword from './components/ForgotPassword';
import Header from './components/Header';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './styles.css';

// For debugging loading issues
console.log('App component loaded');
console.log('Running in environment:', import.meta.env.MODE);
console.log('Base URL:', document.baseURI);

const App: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    console.log('App component mounted');
    console.log('Auth state:', { isAuthenticated: !!user, isAdmin });
    
    // Debug information for GitHub Pages
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Hash:', window.location.hash);
  }, [user, isAdmin]);
  
  return (
    <Router>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <Routes>
            {/* Home route - redirect to auth if not logged in, dashboard if logged in */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Navigate to="/auth" />
                )
              } 
            />
            
            {/* Auth route */}
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/dashboard" /> : <AuthFormSwitcher />} 
            />

            {/* Login route - alias for auth */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <AuthFormSwitcher initialMode="login" />} 
            />
            
            {/* Signup route */}
            <Route 
              path="/signup" 
              element={user ? <Navigate to="/dashboard" /> : <AuthFormSwitcher initialMode="signup" />} 
            />
            
            {/* Password recovery */}
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />
            
            {/* Dashboard route - protected */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin dashboard route - protected and requires admin */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
};

export default App;
