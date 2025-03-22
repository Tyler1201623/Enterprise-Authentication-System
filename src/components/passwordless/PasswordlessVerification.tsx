import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordlessMethod } from '../../utils/passwordless/passwordlessAuth';

interface PasswordlessVerificationProps {
  email: string;
  method: string;
  onCancel: () => void;
}

const PasswordlessVerification: React.FC<PasswordlessVerificationProps> = ({
  email,
  method,
  onCancel
}) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Set up input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits are filled, auto-submit
    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      verifyCode(newCode.join(''));
    }
  };

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      
      // Focus last input after paste
      inputRefs.current[5]?.focus();
      
      // Auto-submit after paste
      verifyCode(pastedData);
    }
  };

  // Verify the code
  const verifyCode = async (verificationCode: string) => {
    try {
      setIsVerifying(true);
      setError(null);
      
      const result = await auth.verifyPasswordlessCode(email, verificationCode, method);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  const methodText = {
    email_link: 'email',
    email_code: 'email',
    sms: 'phone'
  }[method] || 'email';

  return (
    <div className="passwordless-verification">
      <h2>Enter verification code</h2>
      <p>
        We sent a verification code to your {methodText}.
        <br />
        Please enter the code below.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="mfa-input-container" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            className="mfa-digit-input"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isVerifying}
            autoFocus={index === 0}
          />
        ))}
      </div>
      
      <div className="passwordless-actions">
        <button 
          className="secondary-button" 
          onClick={onCancel}
          disabled={isVerifying}
        >
          Cancel
        </button>
        <button 
          className="primary-button" 
          onClick={() => verifyCode(code.join(''))}
          disabled={code.join('').length !== 6 || isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>
      
      <div className="resend-link">
        Didn't receive a code? <button 
          className="text-button"
          onClick={() => auth.startPasswordlessLogin(email, method as PasswordlessMethod)}
          disabled={isVerifying}
        >
          Resend code
        </button>
      </div>
    </div>
  );
};

export default PasswordlessVerification; 