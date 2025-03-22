import React, { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import AuthFormSwitcher from './components/AuthFormSwitcher';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import ForgotPassword from './components/ForgotPassword';
import Header from './components/Header';
import NotFound from './components/NotFound';
import PasswordRecovery from './components/PasswordRecovery';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './styles.css';

// For debugging loading issues
console.log('App component loaded');

const App: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    console.log('App component mounted');
    console.log('Auth state:', { isAuthenticated: !!user, isAdmin });
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
              path="/password-recovery"
              element={<PasswordRecovery />}
            />

            {/* Forgot password */}
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
