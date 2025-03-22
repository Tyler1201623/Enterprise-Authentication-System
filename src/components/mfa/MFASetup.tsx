import * as OTPAuth from 'otpauth';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { disableMFA, enableMFA } from '../../utils/database';

// Styled components for better UI
const MFAContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 500px;
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

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 15px 0;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
`;

const Instructions = styled.p`
  margin: 15px 0;
  line-height: 1.5;
  color: #555;
`;

const InputGroup = styled.div`
  margin: 15px 0;
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
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

const DisableButton = styled(Button)`
  background-color: #f44336;
  &:hover {
    background-color: #e53935;
  }
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin: 15px 0;
  padding: 10px;
  border-radius: 4px;
  background-color: ${props => props.isError ? '#ffebee' : '#e8f5e9'};
  color: ${props => props.isError ? '#c62828' : '#2e7d32'};
`;

const SecretKey = styled.div`
  font-family: monospace;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 10px 0;
  word-break: break-all;
  text-align: center;
`;

/**
 * MFA Setup component to enable or disable two-factor authentication
 */
const MFASetup: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [otpAuth, setOtpAuth] = useState<OTPAuth.TOTP | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Generate OTP secret when component mounts
  useEffect(() => {
    if (user && !user.mfaEnabled) {
      // Generate a secure random secret 
      const randomBytes = new Uint8Array(20);
      window.crypto.getRandomValues(randomBytes);
      const base32Secret = Array.from(randomBytes)
        .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.charAt(b % 32))
        .join('');
        
      const totp = new OTPAuth.TOTP({
        issuer: 'Tyler Keesee Auth',
        label: user.email || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: base32Secret
      });
      
      setOtpAuth(totp);
    }
  }, [user]);

  // Handle verification code input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters
    const numericValue = e.target.value.replace(/\D/g, '');
    setVerificationCode(numericValue);
  };

  // Enable MFA for the user
  const handleEnableMFA = async () => {
    if (!otpAuth || !user) return;
    
    try {
      // Verify the provided code
      const isValid = otpAuth.validate({ 
        token: verificationCode, 
        window: 1 // Allow a time window of ±1 step
      }) !== null;
      
      if (!isValid) {
        setStatus('error');
        setMessage('Invalid verification code. Please try again.');
        return;
      }
      
      // Enable MFA in the database
      const success = enableMFA(user.id, otpAuth.secret.base32);
      
      if (success) {
        setStatus('success');
        setMessage('Two-factor authentication has been enabled successfully.');
        refreshUser(); // Refresh the user data
      } else {
        setStatus('error');
        setMessage('Failed to enable two-factor authentication. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  // Disable MFA for the user
  const handleDisableMFA = async () => {
    if (!user) return;
    
    try {
      // Disable MFA in the database
      const success = disableMFA(user.id);
      
      if (success) {
        setStatus('success');
        setMessage('Two-factor authentication has been disabled.');
        refreshUser(); // Refresh the user data
      } else {
        setStatus('error');
        setMessage('Failed to disable two-factor authentication. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  // If user not authenticated, don't show the MFA setup
  if (!user) {
    return <p>Please log in to access this feature.</p>;
  }

  return (
    <MFAContainer>
      <Title>
        {user.mfaEnabled 
          ? 'Two-Factor Authentication (Enabled)' 
          : 'Setup Two-Factor Authentication'}
      </Title>
      
      {user.mfaEnabled ? (
        <>
          <Instructions>
            Two-factor authentication is currently enabled for your account.
            This adds an extra layer of security by requiring a verification code
            from your authenticator app each time you log in.
          </Instructions>
          
          <DisableButton onClick={handleDisableMFA}>
            Disable Two-Factor Authentication
          </DisableButton>
        </>
      ) : (
        <>
          <Instructions>
            Two-factor authentication adds an extra layer of security to your account.
            When enabled, you'll need to provide a verification code from your
            authenticator app each time you log in.
          </Instructions>
          
          <Instructions>
            <strong>Step 1:</strong> Scan the QR code below with your authenticator app
            (such as Google Authenticator, Authy, or Microsoft Authenticator).
          </Instructions>
          
          {otpAuth && (
            <>
              <QRCodeContainer>
                <div style={{ width: 200, height: 200, backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #ccc' }}>
                  QR Code Placeholder
                </div>
              </QRCodeContainer>
              
              <Instructions>
                <strong>Step 2:</strong> If you can't scan the QR code, enter this secret key
                manually in your authenticator app:
              </Instructions>
              
              <SecretKey>{otpAuth.secret.base32}</SecretKey>
              
              <Instructions>
                <strong>Step 3:</strong> Enter the 6-digit verification code from your
                authenticator app to verify setup:
              </Instructions>
              
              <InputGroup>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={handleCodeChange}
                />
              </InputGroup>
              
              <Button 
                onClick={handleEnableMFA}
                disabled={verificationCode.length !== 6}
              >
                Verify and Enable
              </Button>
            </>
          )}
        </>
      )}
      
      {status !== 'idle' && (
        <StatusMessage isError={status === 'error'}>
          {message}
        </StatusMessage>
      )}
    </MFAContainer>
  );
};

export default MFASetup; 