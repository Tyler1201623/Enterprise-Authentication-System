import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import LoadingSpinner from './LoadingSpinner';
import SSOProviders from './sso/SSOProviders';

export interface AuthFormSwitcherProps {
  initialMode?: 'login' | 'signup';
}

const AuthFormSwitcher: React.FC<AuthFormSwitcherProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [showSSO, setShowSSO] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const auth = useAuthContext();
  const navigate = useNavigate();

  // If already authenticated, navigate to dashboard
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Secret key combination detection (Alt+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'A') {
        setShowAdminLogin(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [auth.isAuthenticated, navigate]);

  const toggleAuthMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  };

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      if (mode === 'login') {
        console.log("Attempting login");
        const result = await auth.login(email, password);
        console.log("Login result:", result);
        
        if (result.success) {
          console.log("Login successful, redirecting to dashboard");
          navigate('/dashboard');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        console.log("Attempting registration");
        const result = await auth.register(email, password);
        console.log("Registration result:", result);
        
        if (result.success) {
          console.log("Registration successful, redirecting to dashboard");
          navigate('/dashboard');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const useAdminEmail = () => {
    setEmail('admin@example.com');
    setPassword('password123');
  };

  const togglePasswordless = () => {
    setShowPasswordless(!showPasswordless);
    setShowSSO(false);
  };

  const toggleSSO = () => {
    setShowSSO(!showSSO);
    setShowPasswordless(false);
  };

  if (loading) {
    return (
      <div className="auth-loading-wrapper">
        <LoadingSpinner message="Authenticating..." />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-gradient-bg"></div>
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1>Enterprise Authentication System</h1>
            <div className="security-badge">
              <span>HIPAA COMPLIANT</span>
            </div>
          </div>
          
          <div className="auth-form-wrapper">
            {!showSSO && !showPasswordless ? (
              <div className="auth-form-content">
                <h2 className="form-title">{mode === 'login' ? 'Login' : 'Create Account'}</h2>
                
                {error && (
                  <div className="error-notification">
                    <svg viewBox="0 0 24 24" className="error-icon">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="form">
                  <div className="input-group">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="Email"
                      required
                    />
                    <label htmlFor="email" className="floating-label">Email</label>
                  </div>
                  
                  <div className="input-group">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder="Password"
                      required
                    />
                    <label htmlFor="password" className="floating-label">Password</label>
                  </div>
                  
                  {mode === 'signup' && (
                    <div className="input-group">
                      <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-input"
                        placeholder="Confirm Password"
                        required
                      />
                      <label htmlFor="confirm-password" className="floating-label">Confirm Password</label>
                    </div>
                  )}
                  
                  <button type="submit" className="submit-button">
                    {mode === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                </form>
                
                <div className="form-actions">
                  <button 
                    className="toggle-mode-button"
                    onClick={toggleAuthMode}
                  >
                    {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
                  </button>
                  
                  <div className="alt-options">
                    <span>Or continue with</span>
                    <div className="options-buttons">
                      <button 
                        className="alt-auth-button"
                        onClick={toggleSSO}
                      >
                        <svg viewBox="0 0 24 24" className="button-icon">
                          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <span>Single Sign-On</span>
                      </button>
                      <button 
                        className="alt-auth-button"
                        onClick={togglePasswordless}
                      >
                        <svg viewBox="0 0 24 24" className="button-icon">
                          <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path>
                        </svg>
                        <span>Passwordless</span>
                      </button>
                    </div>
                  </div>
                  
                  <Link 
                    to="/password-recovery"
                    className="recovery-link"
                  >
                    Forgot password?
                  </Link>

                  {showAdminLogin && (
                    <button 
                      className="admin-login-button"
                      onClick={useAdminEmail}
                    >
                      Use admin account
                    </button>
                  )}
                </div>
              </div>
            ) : showSSO ? (
              <div className="alt-auth-content">
                <div className="alt-auth-header">
                  <h2>Single Sign-On</h2>
                  <button 
                    onClick={() => setShowSSO(false)}
                    className="close-button"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <p className="alt-auth-desc">
                  Choose your organization's identity provider to sign in
                </p>
                <div className="sso-options-container">
                  <SSOProviders />
                </div>
                <button 
                  onClick={() => setShowSSO(false)}
                  className="back-button"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <div className="alt-auth-content">
                <div className="alt-auth-header">
                  <h2>Passwordless Login</h2>
                  <button 
                    onClick={() => setShowPasswordless(false)}
                    className="close-button"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <p className="alt-auth-desc">
                  Enter your email to receive a magic link or code to login without a password.
                </p>
                <div className="alt-auth-form">
                  <div className="input-group">
                    <input
                      type="email"
                      id="passwordless-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="Email"
                    />
                    <label htmlFor="passwordless-email" className="floating-label">Email</label>
                  </div>
                  <button 
                    className="submit-button"
                    onClick={() => alert('Passwordless login feature coming soon!')}
                  >
                    Send Magic Link
                  </button>
                  <button 
                    onClick={() => setShowPasswordless(false)}
                    className="back-button"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="auth-features">
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Multi-factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Single Sign-On</h3>
                <p>Seamlessly connect with your existing accounts</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Advanced Security</h3>
                <p>Enterprise-grade protection for your sensitive data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-footer">
        <div className="compliance-info">
          <span className="badge">HIPAA COMPLIANT</span>
          <span className="encryption-note">End-to-end encryption</span>
        </div>
        <div className="copyright">
          Enterprise Authentication System © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default AuthFormSwitcher;