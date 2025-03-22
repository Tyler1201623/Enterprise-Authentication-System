import * as OTPAuth from 'otpauth';
import React, { useState } from 'react';
import styled from 'styled-components';

// Styled components for UI consistency
const MFAContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const Instructions = styled.p`
  margin: 15px 0;
  line-height: 1.5;
  color: #555;
`;

const CodeInputContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const DigitInput = styled.input`
  width: 40px;
  height: 50px;
  margin: 0 5px;
  text-align: center;
  font-size: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }
`;

const Button = styled.button`
  margin: 10px 0;
  padding: 12px 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3b78e7;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin: 15px 0;
  padding: 10px;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
`;

interface MFAVerificationProps {
  secret: string;
  onVerify: (isValid: boolean) => void;
  onCancel: () => void;
}

/**
 * MFA Verification component for two-factor authentication during login
 */
const MFAVerification: React.FC<MFAVerificationProps> = ({ 
  secret, 
  onVerify, 
  onCancel 
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());

  // Handle digit input change
  const handleDigitChange = (index: number, value: string) => {
    // Allow only numeric input
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // Take only the last character
    setDigits(newDigits);

    // Move focus to next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle key down for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus to previous input when backspace is pressed on an empty field
      inputRefs[index - 1].current?.focus();
    }
  };

  // Handle verification
  const handleVerify = () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      // Create TOTP object with the user's secret
      const totp = new OTPAuth.TOTP({
        issuer: 'Tyler Keesee Auth',
        label: 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      // Validate the token
      const isValid = totp.validate({ 
        token: code, 
        window: 1 // Allow a time window of ±1 step for clock drift
      }) !== null;

      if (isValid) {
        onVerify(true);
      } else {
        setError('Invalid verification code. Please try again.');
        setDigits(Array(6).fill(''));
        inputRefs[0].current?.focus();
      }
    } catch (error) {
      setError(`Verification error: ${(error as Error).message}`);
    }
  };

  return (
    <MFAContainer>
      <Title>Two-Factor Authentication</Title>
      
      <Instructions>
        Please enter the 6-digit verification code from your authenticator app:
      </Instructions>
      
      <CodeInputContainer>
        {digits.map((digit, index) => (
          <DigitInput 
            key={index}
            ref={inputRefs[index]}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            autoFocus={index === 0}
          />
        ))}
      </CodeInputContainer>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Button 
        onClick={handleVerify}
        disabled={digits.filter(Boolean).length !== 6}
      >
        Verify
      </Button>
      
      <Button 
        onClick={onCancel}
        style={{ backgroundColor: '#757575' }}
      >
        Cancel
      </Button>
    </MFAContainer>
  );
};

export default MFAVerification; 