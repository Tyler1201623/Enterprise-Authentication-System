import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await auth.sendPasswordRecoveryEmail(email);
      
      if (result.success) {
        setSuccessMessage(`Password reset instructions have been sent to ${email}. Please check your inbox.`);
      } else {
        setError(result.error || 'Failed to send password reset email');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Your Password</h2>
      
      {successMessage ? (
        <div className="reset-success">
          <div className="reset-success-icon">✓</div>
          <p>{successMessage}</p>
          <button 
            className="primary-button" 
            onClick={() => navigate('/login')}
          >
            Return to Login
          </button>
        </div>
      ) : (
        <>
          <p>Enter your email address and we'll send you instructions to reset your password.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="primary-button" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
            
            <button 
              type="button" 
              className="text-button" 
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPassword; 