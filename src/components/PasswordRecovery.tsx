import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { initiatePasswordRecovery, resetPassword, validateRecoveryToken } from '../utils/accountRecovery';
import { validatePassword } from '../utils/passwordPolicy';

const RecoveryContainer = styled.div`
  max-width: 500px;
  margin: 40px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: var(--primary-color);
  text-align: center;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const Step = styled.div<{ $active: boolean, $complete: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.$complete 
    ? 'var(--accent-color)' 
    : props.$active 
      ? 'var(--primary-color)' 
      : 'var(--med-grey)'};
  color: white;
  font-weight: bold;
  margin: 0 5px;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    width: 50px;
    height: 2px;
    background-color: ${props => props.$complete 
      ? 'var(--accent-color)' 
      : 'var(--med-grey)'};
    right: -30px;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--med-grey);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  
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

const Message = styled.div<{ isError?: boolean }>`
  padding: 12px;
  background-color: ${props => props.isError 
    ? 'rgba(219, 68, 55, 0.1)' 
    : 'rgba(15, 157, 88, 0.1)'};
  border-radius: 4px;
  margin-bottom: 20px;
  color: ${props => props.isError ? 'var(--error-color)' : 'var(--accent-color)'};
`;

const StrengthMeter = styled.div`
  height: 4px;
  background-color: var(--light-grey);
  margin-top: 8px;
  border-radius: 2px;
  overflow: hidden;
`;

const StrengthIndicator = styled.div<{ strength: number }>`
  height: 100%;
  width: ${props => `${props.strength * 20}%`};
  background-color: ${props => {
    if (props.strength <= 1) return 'var(--error-color)';
    if (props.strength === 2) return 'var(--warning-color)';
    if (props.strength === 3) return '#ffeb3b';
    if (props.strength === 4) return '#8bc34a';
    return 'var(--accent-color)';
  }};
  border-radius: 2px;
  transition: width 0.3s, background-color 0.3s;
`;

const Requirements = styled.ul`
  margin-top: 8px;
  padding-left: 20px;
  font-size: 14px;
  color: var(--dark-grey);
`;

const Requirement = styled.li<{ met: boolean }>`
  color: ${props => props.met ? 'var(--accent-color)' : 'var(--dark-grey)'};
  margin-bottom: 4px;
`;

const PasswordRecovery: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Password strength requirements state
  const [meetsLength, setMeetsLength] = useState(false);
  const [meetsUppercase, setMeetsUppercase] = useState(false);
  const [meetsLowercase, setMeetsLowercase] = useState(false);
  const [meetsNumber, setMeetsNumber] = useState(false);
  const [meetsSpecial, setMeetsSpecial] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const token = await initiatePasswordRecovery(email);
      console.log(`RECOVERY TOKEN FOR ${email}: ${token}`);
      setMessage(`Recovery email sent to ${email}. Your recovery token is: ${token}`);
      setStep(2);
    } catch (err) {
      setError('Unable to initiate password recovery. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const isValid = await validateRecoveryToken(email, token);
      if (isValid) {
        setMessage('Token validated successfully. You can now reset your password.');
        setStep(3);
      } else {
        setError('Invalid or expired token. Please check and try again.');
      }
    } catch (err) {
      setError('Error validating token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordRequirements = (password: string) => {
    setMeetsLength(password.length >= 12);
    setMeetsUppercase(/[A-Z]/.test(password));
    setMeetsLowercase(/[a-z]/.test(password));
    setMeetsNumber(/[0-9]/.test(password));
    setMeetsSpecial(/[^A-Za-z0-9]/.test(password));
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    checkPasswordRequirements(password);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    const validationResult = validatePassword(newPassword);
    if (!validationResult.valid) {
      setError(`Password does not meet requirements: ${validationResult.message}`);
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(email, token, newPassword);
      setMessage('Password has been reset successfully. You will be redirected to login.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('Error resetting password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecoveryContainer>
      <Title>Password Recovery</Title>
      
      <StepIndicator>
        <Step $active={step === 1} $complete={step > 1}>1</Step>
        <Step $active={step === 2} $complete={step > 2}>2</Step>
        <Step $active={step === 3} $complete={step > 3}>3</Step>
      </StepIndicator>
      
      {message && <Message>{message}</Message>}
      {error && <Message isError>{error}</Message>}
      
      {step === 1 && (
        <Form onSubmit={handleEmailSubmit}>
          <FormGroup>
            <Label htmlFor="email">Enter your email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
          </FormGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Send Recovery Email'}
          </Button>
        </Form>
      )}
      
      {step === 2 && (
        <Form onSubmit={handleTokenValidation}>
          <FormGroup>
            <Label htmlFor="token">Enter the recovery token from your email</Label>
            <Input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Recovery token"
            />
          </FormGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'Validating...' : 'Validate Token'}
          </Button>
        </Form>
      )}
      
      {step === 3 && (
        <Form onSubmit={handlePasswordReset}>
          <FormGroup>
            <Label htmlFor="newPassword">Create a new password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              required
            />
            <StrengthMeter>
              <StrengthIndicator strength={passwordStrength} />
            </StrengthMeter>
            <Requirements>
              <Requirement met={meetsLength}>At least 12 characters long</Requirement>
              <Requirement met={meetsUppercase}>At least one uppercase letter</Requirement>
              <Requirement met={meetsLowercase}>At least one lowercase letter</Requirement>
              <Requirement met={meetsNumber}>At least one number</Requirement>
              <Requirement met={meetsSpecial}>At least one special character</Requirement>
            </Requirements>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormGroup>
          
          <Button 
            type="submit" 
            disabled={loading || newPassword !== confirmPassword || passwordStrength < 3}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Form>
      )}
    </RecoveryContainer>
  );
};

export default PasswordRecovery; 