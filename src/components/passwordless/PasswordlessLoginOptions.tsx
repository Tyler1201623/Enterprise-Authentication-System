import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordlessMethod } from '../../utils/passwordless/passwordlessAuth';

interface PasswordlessLoginOptionsProps {
  email: string;
  onLoginStarted: (method: string) => void;
}

const PasswordlessLoginOptions: React.FC<PasswordlessLoginOptionsProps> = ({ 
  email,
  onLoginStarted
}) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPasswordlessLogin = async (method: string) => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await auth.startPasswordlessLogin(email, method as PasswordlessMethod);
      
      if (result.success) {
        onLoginStarted(method);
      } else {
        setError(result.error || "Failed to initiate passwordless login");
      }
    } catch (err) {
      console.error("Error starting passwordless login:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="passwordless-loading">Sending login instructions...</div>;
  }

  return (
    <div className="passwordless-section">
      <h3 className="passwordless-title">Or login without password</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="passwordless-options">
        <div 
          className="passwordless-option" 
          onClick={() => startPasswordlessLogin('email_link')}
        >
          <span className="passwordless-icon">✉️</span>
          <span className="passwordless-label">Email magic link</span>
        </div>
        
        <div 
          className="passwordless-option" 
          onClick={() => startPasswordlessLogin('email_code')}
        >
          <span className="passwordless-icon">🔢</span>
          <span className="passwordless-label">Email verification code</span>
        </div>
        
        <div 
          className="passwordless-option" 
          onClick={() => startPasswordlessLogin('sms')}
        >
          <span className="passwordless-icon">📱</span>
          <span className="passwordless-label">SMS verification code</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordlessLoginOptions; 