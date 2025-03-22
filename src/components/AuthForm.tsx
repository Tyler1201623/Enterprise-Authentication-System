import React, { useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const auth = useAuthContext();

  const validatePasswords = () => {
    if (!isLogin && password !== confirmPassword) {
      setFormError("Passwords don't match");
      return false;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    try {
      if (isLogin) {
        const result = await auth.login(email, password);
        if (result.success) {
          setSuccessMessage('Login successful!');
        } else {
          setFormError(result.error || 'Invalid email or password');
        }
      } else {
        const result = await auth.register(email, password);
        if (result.success) {
          setSuccessMessage('Account created and logged in!');
        } else {
          setFormError(result.error || 'Failed to create account');
        }
      }
    } catch (error) {
      setFormError('An unexpected error occurred');
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormError('');
    setSuccessMessage('');
  };

  return (
    <div className="auth-form-container">
      <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
      
      {formError && <div className="error-message">{formError}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
          />
        </div>
        
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        
        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Login' : 'Create Account'}
        </button>
      </form>
      
      <div className="auth-switch">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button className="link-button" onClick={toggleMode}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
} 