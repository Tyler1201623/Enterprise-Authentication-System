import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { enableMFA, logAction } from '../utils/database';
import {
    encryptMfaSecret,
    generateMfaSecret,
    generateQrCodeUri,
    generateRecoveryCodes,
    verifyToken
} from '../utils/mfa';

const MfaSetup: React.FC = () => {
  const { user, refreshUser } = useAuthContext();
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'complete'>('intro');
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUri, setQrCodeUri] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Skip if user already has MFA enabled
    if (user?.mfaEnabled) {
      setStep('complete');
    }
  }, [user]);

  const handleStartSetup = async () => {
    try {
      setIsLoading(true);
      // Generate new secret
      const newSecret = generateMfaSecret();
      setSecret(newSecret);
      
      // Generate QR code URI for authenticator apps
      if (user?.email) {
        const uri = generateQrCodeUri(user.email, newSecret);
        setQrCodeUri(uri);
      }
      
      setStep('setup');
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting MFA setup:', error);
      setError('Failed to start MFA setup. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Verify the token against the secret
      if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
        setError('Please enter a valid 6-digit token');
        setIsLoading(false);
        return;
      }
      
      const isValid = verifyToken(token, secret);
      
      if (isValid) {
        // Generate recovery codes
        const codes = generateRecoveryCodes();
        setRecoveryCodes(codes);
        
        // Enable MFA for the user in database
        if (user) {
          try {
            const encryptedSecret = encryptMfaSecret(secret);
            
            // Enable MFA for the user
            const success = enableMFA(user.id, encryptedSecret, codes);
            
            if (success) {
              // Log the action
              logAction('MFA enabled', { userId: user.id });
              
              // Refresh user data
              if (refreshUser) {
                await refreshUser();
              }
              
              setStep('complete');
            } else {
              setError('Failed to enable MFA. Please try again.');
            }
          } catch (err) {
            console.error('Error enabling MFA:', err);
            setError('Failed to enable MFA. Please try again.');
          }
        }
      } else {
        setError('Invalid verification code. Please try again.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      setError('Failed to verify token. Please try again.');
      setIsLoading(false);
    }
  };

  if (user?.mfaEnabled) {
    return (
      <div className="mfa-setup-container">
        <h2>Multi-Factor Authentication</h2>
        <div className="alert alert-success">
          <p>Multi-Factor Authentication is already enabled for your account.</p>
        </div>
        <button 
          className="btn btn-danger"
          onClick={() => {
            // TODO: Implement MFA disable functionality
            console.log('Disable MFA clicked');
          }}
        >
          Disable MFA
        </button>
      </div>
    );
  }

  return (
    <div className="mfa-setup-container">
      <h2>Multi-Factor Authentication Setup</h2>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {step === 'intro' && (
        <div className="mfa-intro">
          <p>
            Enable Multi-Factor Authentication to add an extra layer of 
            security to your account. This will require you to enter a 
            verification code from your authenticator app in addition to 
            your password when signing in.
          </p>
          <p>
            <strong>HIPAA Compliance:</strong> Multi-factor authentication is
            a key component of HIPAA security requirements for healthcare
            organizations.
          </p>
          <button 
            className="btn btn-primary"
            onClick={handleStartSetup}
            disabled={isLoading}
          >
            {isLoading ? 'Setting up...' : 'Setup MFA'}
          </button>
        </div>
      )}
      
      {step === 'setup' && (
        <div className="mfa-setup">
          <h3>Scan QR Code</h3>
          <p>
            Scan this QR code with your authenticator app (Google Authenticator, 
            Microsoft Authenticator, Authy, etc.)
          </p>
          
          <div className="qr-code-container">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`} 
              alt="QR Code for MFA Setup" 
            />
          </div>
          
          <p>
            <strong>Manual Entry:</strong> If you can't scan the QR code, enter this code 
            manually in your authenticator app:
          </p>
          <div className="secret-code">{secret}</div>
          
          <h3>Verify Setup</h3>
          <p>Enter the 6-digit code from your authenticator app to verify setup:</p>
          
          <div className="verification-form">
            <input 
              type="text" 
              value={token}
              onChange={(e) => setToken(e.target.value.slice(0, 6))}
              maxLength={6}
              placeholder="6-digit code"
              className="form-control"
            />
            <button 
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}
      
      {step === 'complete' && (
        <div className="mfa-complete">
          <div className="alert alert-success">
            <h3>MFA Setup Complete!</h3>
            <p>Multi-Factor Authentication has been successfully enabled for your account.</p>
          </div>
          
          {recoveryCodes.length > 0 && (
            <div className="recovery-codes">
              <h3>Recovery Codes</h3>
              <p>
                <strong>Important:</strong> Save these recovery codes in a secure place. 
                If you lose access to your authenticator app, you can use one of these 
                codes to sign in. Each code can only be used once.
              </p>
              <div className="codes-container">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="recovery-code">{code}</div>
                ))}
              </div>
              <p className="warning">
                These codes will not be shown again. Please save them now.
              </p>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  const codesText = recoveryCodes.join('\n');
                  navigator.clipboard.writeText(codesText);
                }}
              >
                Copy Codes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MfaSetup; 