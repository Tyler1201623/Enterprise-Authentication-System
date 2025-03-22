import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const VerificationContainer = styled.div`
  max-width: 450px;
  margin: 40px auto;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: var(--primary-color);
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Message = styled.div<{ isError?: boolean }>`
  padding: 12px;
  background-color: ${props => props.isError 
    ? 'rgba(219, 68, 55, 0.1)' 
    : 'rgba(15, 157, 88, 0.1)'};
  border-radius: 4px;
  margin-bottom: 20px;
  color: ${props => props.isError ? 'var(--error-color)' : 'var(--accent-color)'};
`;

const DigitGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
`;

const DigitInput = styled.input`
  width: 40px;
  height: 50px;
  text-align: center;
  font-size: 24px;
  border: 1px solid var(--med-grey);
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: var(--dark-grey);
    cursor: not-allowed;
  }
`;

const TimerBar = styled.div`
  height: 4px;
  background-color: var(--light-grey);
  margin: 15px 0;
  position: relative;
  border-radius: 2px;
  overflow: hidden;
`;

const TimerProgress = styled.div<{ width: number }>`
  position: absolute;
  height: 100%;
  background-color: var(--primary-color);
  width: ${props => props.width}%;
  transition: width 1s linear;
`;

const Footer = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--dark-grey);
`;

const Link = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface MFAVerificationProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ email, onSuccess, onCancel }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerWidth, setTimerWidth] = useState(100);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const inputRefs = Array(6).fill(0).map(() => useRef<HTMLInputElement>(null));
  
  // Handle timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
      
      setTimerWidth(prev => {
        if (prev <= 3.33) {
          return 100; // Reset to 100%
        }
        return prev - 3.33; // 100/30 to decrease linearly over 30 seconds
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    
    // Auto-focus next input if a digit was entered
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
    
    // Auto-submit if all digits are filled
    if (value && index === 5 && newDigits.every(d => d)) {
      handleVerify();
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedDigits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    if (pastedDigits.length > 0) {
      const newDigits = [...digits];
      pastedDigits.forEach((digit, index) => {
        if (index < 6) {
          newDigits[index] = digit;
        }
      });
      setDigits(newDigits);
      
      // Focus last filled input or the next empty one
      const lastFilledIndex = Math.min(5, pastedDigits.length - 1);
      inputRefs[lastFilledIndex].current?.focus();
      
      // Auto-submit if all 6 digits were pasted
      if (pastedDigits.length === 6) {
        setTimeout(() => handleVerify(), 100);
      }
    }
  };
  
  const handleVerify = async () => {
    try {
      setError('');
      setLoading(true);
      
      const code = digits.join('');
      if (code.length !== 6) {
        setError('Please enter all 6 digits of your verification code.');
        return;
      }
      
      // In a real implementation, we would verify the code against the user's secret
      // For this example, we'll just check for a match with the current generated code
      // or a hardcoded fallback code "123456" for testing
      const success = code === "123456" || await login(email, "password", code);
      
      if (success) {
        onSuccess();
        navigate('/dashboard');
      } else {
        setError('Invalid verification code. Please try again.');
        // Clear the digits for a retry
        setDigits(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      setError('Error verifying code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <VerificationContainer>
      <Title>Two-Factor Authentication</Title>
      
      {error && <Message isError>{error}</Message>}
      
      <p>
        Enter the 6-digit code from your authenticator app for:
        <br />
        <strong>{email}</strong>
      </p>
      
      <TimerBar>
        <TimerProgress width={timerWidth} />
      </TimerBar>
      <p style={{ textAlign: 'center', fontSize: '14px', margin: '5px 0' }}>
        Code refreshes in {timeLeft} seconds
      </p>
      
      <Form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
        <DigitGroup>
          {digits.map((digit, index) => (
            <DigitInput
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              ref={inputRefs[index]}
              required
              autoFocus={index === 0}
            />
          ))}
        </DigitGroup>
        
        <Button type="submit" disabled={loading || !digits.every(d => d)}>
          {loading ? 'Verifying...' : 'Verify Authentication Code'}
        </Button>
        
        <Button 
          type="button" 
          onClick={onCancel}
          style={{ 
            marginTop: '10px', 
            backgroundColor: 'transparent', 
            color: 'var(--dark-grey)' 
          }}
        >
          Back to Login
        </Button>
      </Form>
      
      <Footer>
        Lost access to your authenticator app?{' '}
        <Link href="#" onClick={() => navigate('/recovery')}>
          Use a recovery code
        </Link>
      </Footer>
    </VerificationContainer>
  );
};

export default MFAVerification; 