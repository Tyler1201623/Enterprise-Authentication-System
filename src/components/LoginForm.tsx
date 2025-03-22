import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authAnalytics from '../utils/analytics/authAnalytics';
import { AuthEventType } from '../utils/analytics/authAnalytics';
import PasswordlessLoginOptions from './passwordless/PasswordlessLoginOptions';
import PasswordlessVerification from './passwordless/PasswordlessVerification';

export interface LoginFormProps {
  onSwitchToSignup: () => void;
  onEmailCheck: (email: string) => boolean;
  onLoginSuccess: (userId: string, email: string, isAdmin: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSwitchToSignup, 
  onEmailCheck, 
  onLoginSuccess 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<{success: boolean, text: string} | null>(null);
  const [passwordlessMode, setPasswordlessMode] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();
  
  // Secret keys sequence for admin access
  const [keySequence, setKeySequence] = useState<string[]>([]);
  // The secret key sequence is "admin" 
  const ADMIN_SEQUENCE = ["a", "d", "m", "i", "n"];

  const validateForm = () => {
    if (!email) {
      setError('Please enter your email');
      return false;
    }
    
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    
    // For security reasons, don't reveal if email exists
    if (!onEmailCheck(email)) {
      console.log('Email validation failed, but continuing for security reasons');
    }
    
    return true;
  };

  const validateMfaForm = () => {
    if (!mfaToken) {
      setError('Please enter the verification code');
      return false;
    }
    
    if (mfaToken.length < 6) {
      setError('Verification code must be at least 6 digits');
      return false;
    }
    
    return true;
  };

  // Handle the email domain check when the email changes
  useEffect(() => {
    if (email && email.includes('@')) {
      onEmailCheck(email);
    }
  }, [email, onEmailCheck]);

  // Add keyboard listener for the secret admin sequence
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Alt' || e.key === 'Control' || e.key === 'Shift' || e.key === 'Meta') {
      return; // Ignore modifier keys
    }
    
    // Only track lowercase letters
    const key = e.key.toLowerCase();
    
    // Update key sequence, keeping only the last 5 keys
    setKeySequence(prev => {
      const newSequence = [...prev, key].slice(-ADMIN_SEQUENCE.length);
      
      // Check if the sequence matches the admin sequence
      if (newSequence.join('') === ADMIN_SEQUENCE.join('')) {
        handleEmergencyAdminAccess();
        return []; // Reset after triggering
      }
      
      return newSequence;
    });
  }, []);

  // Set up and clean up keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (showMfa) {
        // User has already entered email/password and now is entering MFA code
        const result = await auth.login(email, password);
        
        if (result.success) {
          // Check if this is an admin user and redirect accordingly
          if (result.user && result.user.role === 'admin') {
            navigate('/admin');
            return;
          }
          
          // Regular user login success
          onLoginSuccess(result.user?.id || '', email, result.user?.role === 'admin');
          
          // Log successful login with MFA
          authAnalytics.trackAuthEvent(AuthEventType.LOGIN_SUCCESS, {
            userId: result.user?.id,
            email,
            success: true,
            metadata: { usedMfa: true }
          });
        } else {
          setError(result.error || 'Invalid MFA code');
          setLoading(false);
          
          // Log failed MFA attempt
          authAnalytics.trackAuthEvent(AuthEventType.MFA_FAILURE, {
            email,
            success: false,
            metadata: { error: result.error }
          });
        }
        return;
      }
      
      // Normal login flow (first attempt)
      if (!validateForm()) {
        return;
      }
      
      setLoading(true);
      
      // Check if this is an emergency admin login
      if (email.toLowerCase() === 'keeseetyler@yahoo.com') {
        console.log('Admin login attempt');
        const result = await auth.login(email, password);
        
        if (result.success) {
          // Admin login successful, redirect to admin dashboard
          navigate('/admin');
          
          // Log successful admin login
          authAnalytics.trackAuthEvent(AuthEventType.ADMIN_LOGIN, {
            userId: result.user?.id,
            email,
            success: true
          });
          return;
        } else if (result.requiresMfa) {
          // Show MFA screen for admin
          setShowMfa(true);
          setMfaToken('');
          setLoading(false);
          return;
        } else {
          setError(result.error || 'Failed to log in as admin');
          setLoading(false);
          
          // Log failed admin login
          authAnalytics.trackAuthEvent(AuthEventType.ADMIN_LOGIN, {
            email,
            success: false,
            metadata: { error: result.error }
          });
          return;
        }
      }
      
      // Standard login attempt
      const result = await auth.login(email, password);
      
      if (result.requiresMfa) {
        // MFA is required, show MFA input
        setShowMfa(true);
        setMfaToken(''); // Reset the MFA token field
        setLoading(false);
        
        // Log MFA requirement
        authAnalytics.trackAuthEvent(AuthEventType.MFA_REQUIRED, {
          email,
          metadata: { source: 'login' }
        });
        return;
      }
      
      if (result.success) {
        // Log successful login
        authAnalytics.trackAuthEvent(AuthEventType.LOGIN_SUCCESS, {
          userId: result.user?.id,
          email,
          success: true
        });
        
        // Check if this is an admin user and redirect accordingly
        if (result.user && result.user.role === 'admin') {
          navigate('/admin');
          return;
        }
        
        // Regular user login success
        onLoginSuccess(result.user?.id || '', email, result.user?.role === 'admin');
      } else {
        // Login failed
        setError(result.error || 'Invalid credentials');
        
        // Log failed login
        authAnalytics.trackAuthEvent(AuthEventType.LOGIN_FAILURE, {
          email,
          success: false,
          metadata: { error: result.error }
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      
      // Log error
      authAnalytics.trackAuthEvent(AuthEventType.LOGIN_ERROR, {
        email,
        success: false,
        metadata: { error: String(error) }
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateMfaForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Attempt to login with MFA token
      const result = await auth.login(email, password);
      
      if (result.success) {
        // Login succeeded
        const isAdmin = result.user?.role === 'admin';
        onLoginSuccess(result.user?.id || '', email, isAdmin);
        
        // Track MFA success
        authAnalytics.trackAuthEvent(AuthEventType.MFA_SUCCESS, {
          userId: result.user?.id,
          email,
          success: true
        });
      } else {
        // Login failed
        setError(result.error || 'Invalid authentication code');
        
        // Track MFA failure
        authAnalytics.trackAuthEvent(AuthEventType.MFA_FAILURE, {
          email,
          success: false,
          metadata: { error: result.error }
        });
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordlessStart = () => {
    setPasswordlessMode('selecting');
  };
  
  const handlePasswordlessOptionSelected = (method: string) => {
    setPasswordlessMode(method);
  };
  
  const handleCancelPasswordless = () => {
    setPasswordlessMode(null);
  };
  
  const handleEmergencyAdminAccess = () => {
    setAdminMessage({success: true, text: 'Emergency Admin Access: Enter keeseetyler@yahoo.com with any password.'});
    
    // Auto-fill the email field for convenience
    setEmail('keeseetyler@yahoo.com');
    
    // Focus the password field
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.focus();
    }
    
    // Clear the message after 5 seconds
    setTimeout(() => {
      setAdminMessage(null);
    }, 5000);
  };

  // If in passwordless verification mode
  if (passwordlessMode && passwordlessMode !== 'selecting') {
    return (
      <PasswordlessVerification
        email={email}
        method={passwordlessMode}
        onCancel={handleCancelPasswordless}
      />
    );
  }

  // If showing MFA form
  if (showMfa) {
    return (
      <div className="mfa-form">
        <h3>Two-Factor Authentication</h3>
        <p>Please enter the verification code from your authenticator app</p>
        
        <form onSubmit={handleMfaSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="mfa-input"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowMfa(false)}
          >
            Back
          </button>
        </form>
      </div>
    );
  }
  
  // Main login form
  return (
    <div className="login-form">
      <h3>Login</h3>
      
      {adminMessage && (
        <div className={`admin-message ${adminMessage.success ? 'success' : 'error'}`}>
          {adminMessage.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePasswordlessStart}
          disabled={loading || !email}
        >
          Login without password
        </button>
      </form>
      
      <div className="form-links">
        <button 
          type="button" 
          className="link-button" 
          onClick={onSwitchToSignup}
        >
          Need an account? Sign Up
        </button>
        
        <button 
          type="button" 
          className="link-button" 
          onClick={() => navigate('/forgot-password')}
        >
          Forgot Password?
        </button>
      </div>
      
      {passwordlessMode === 'selecting' && (
        <PasswordlessLoginOptions
          email={email}
          onLoginStarted={handlePasswordlessOptionSelected}
        />
      )}
    </div>
  );
};

export default LoginForm; 