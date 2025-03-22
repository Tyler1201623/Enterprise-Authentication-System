import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { completePasswordlessAuth, initiatePasswordlessAuth, PasswordlessMethod, verifyPasswordlessCode } from '../../utils/passwordless/passwordlessAuth';

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #4a5568;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3182ce;
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background-color: #fed7d7;
  color: #c53030;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  padding: 0.75rem;
  background-color: #c6f6d5;
  color: #2f855a;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const MethodSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MethodButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px;
  background-color: ${props => props.$active ? 'var(--primary-light)' : 'transparent'};
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 4px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--primary-light);
  }
`;

const CodeInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
`;

const CodeDigit = styled.input`
  width: 3rem;
  height: 3rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  }
`;

const Timer = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  color: #4a5568;
  font-size: 0.875rem;
`;

const SecondaryButton = styled.button`
  padding: 0.5rem;
  background-color: transparent;
  color: #4299e1;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s;
  text-align: center;
  margin-top: 0.5rem;

  &:hover {
    color: #2b6cb0;
    text-decoration: underline;
  }
`;

interface PasswordlessLoginProps {
  onLoginSuccess: (identifier: string) => void;
  onCancel: () => void;
}

const PasswordlessLogin: React.FC<PasswordlessLoginProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'init' | 'verify'>('init');
  const [method, setMethod] = useState<PasswordlessMethod>(PasswordlessMethod.EMAIL_LINK);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [linkSent, setLinkSent] = useState(false);

  const codeInputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef<HTMLInputElement>());

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      if (!identifier.trim()) {
        throw new Error('Email is required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        throw new Error('Please enter a valid email address');
      }
      
      const result = initiatePasswordlessAuth(identifier, method);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.requestId) {
        setRequestId(result.requestId);
        
        if (method === PasswordlessMethod.EMAIL_LINK) {
          setLinkSent(true);
          setSuccess('Magic link sent to your email. Please check your inbox and spam folder.');
        } else {
          setStep('verify');
          setCountdown(300); // 5 minutes
          setSuccess('Verification code sent to your email.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!requestId) {
        throw new Error('No active verification request');
      }
      
      const codeString = code.join('');
      
      if (codeString.length !== 6 || !/^\d+$/.test(codeString)) {
        throw new Error('Please enter a valid 6-digit code');
      }
      
      const verifyResult = verifyPasswordlessCode(requestId, codeString);
      
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Invalid verification code');
      }
      
      const completeResult = completePasswordlessAuth(requestId);
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Failed to complete authentication');
      }
      
      setSuccess('Verification successful! Logging you in...');
      
      // Give user a chance to see the success message
      setTimeout(() => {
        if (completeResult.identifier) {
          onLoginSuccess(completeResult.identifier);
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting the whole code
      const digits = value.split('').slice(0, 6);
      const newCode = [...code];
      
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      
      setCode(newCode);
      
      // Focus the next input after the filled ones
      if (index + digits.length < 6) {
        codeInputRefs[index + digits.length].current?.focus();
      }
    } else if (/^\d*$/.test(value)) {
      // If typing a single digit
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Auto-focus the next input
      if (value && index < 5) {
        codeInputRefs[index + 1].current?.focus();
      }
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input when backspacing an empty input
      codeInputRefs[index - 1].current?.focus();
    }
  };

  const handleResendCode = () => {
    setCode(Array(6).fill(''));
    handleInitiate(new Event('submit') as any);
  };

  const toggleMethod = (newMethod: PasswordlessMethod) => {
    setMethod(newMethod);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    onCancel();
  };

  const renderInitialStep = () => (
    <>
      <Title>Passwordless Sign In</Title>
      <Subtitle>Sign in securely without a password</Subtitle>
      
      <MethodSelector>
        <MethodButton 
          $active={method === PasswordlessMethod.EMAIL_LINK}
          onClick={() => toggleMethod(PasswordlessMethod.EMAIL_LINK)}
        >
          Email Link
        </MethodButton>
        <MethodButton 
          $active={method === PasswordlessMethod.EMAIL_CODE}
          onClick={() => toggleMethod(PasswordlessMethod.EMAIL_CODE)}
        >
          Email Code
        </MethodButton>
      </MethodSelector>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <Form onSubmit={handleInitiate}>
        <InputGroup>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading || linkSent}
          />
        </InputGroup>
        
        {!linkSent ? (
          <Button type="submit" disabled={loading || !identifier.trim()}>
            {loading ? 'Sending...' : method === PasswordlessMethod.EMAIL_LINK ? 'Send Magic Link' : 'Send Code'}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={handleResendCode} disabled={loading}>
              Resend Magic Link
            </Button>
            <SecondaryButton type="button" onClick={handleCancel}>
              Use Another Method
            </SecondaryButton>
          </>
        )}
      </Form>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <Title>Verify Your Identity</Title>
      <Subtitle>Enter the 6-digit code sent to {identifier}</Subtitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <Form onSubmit={handleVerify}>
        <CodeInputContainer>
          {code.map((digit, index) => (
            <CodeDigit
              key={index}
              ref={codeInputRefs[index]}
              type="text"
              maxLength={6} // Allow pasting the whole code
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              required
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </CodeInputContainer>
        
        {countdown > 0 && (
          <Timer>
            Code expires in: {formatCountdown()}
          </Timer>
        )}
        
        <Button type="submit" disabled={loading || code.some(d => !d)}>
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>
        
        {countdown === 0 ? (
          <SecondaryButton type="button" onClick={handleResendCode} disabled={loading}>
            Resend Code
          </SecondaryButton>
        ) : (
          <SecondaryButton type="button" onClick={handleCancel}>
            Back
          </SecondaryButton>
        )}
      </Form>
    </>
  );

  return (
    <Container>
      {step === 'init' ? renderInitialStep() : renderVerifyStep()}
    </Container>
  );
};

export default PasswordlessLogin; 