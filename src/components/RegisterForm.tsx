import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { getPasswordStrengthLevel, validatePassword } from '../utils/passwordPolicy';

const FormContainer = styled.div`
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

const ErrorMessage = styled.div`
  padding: 12px;
  background-color: rgba(219, 68, 55, 0.1);
  color: var(--error-color);
  border-radius: 4px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  padding: 12px;
  background-color: rgba(15, 157, 88, 0.1);
  color: var(--accent-color);
  border-radius: 4px;
  margin-bottom: 20px;
`;

const Footer = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
`;

const StyledLink = styled(Link)`
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PasswordRequirements = styled.ul`
  margin-top: 8px;
  padding-left: 20px;
  font-size: 14px;
  color: var(--dark-grey);
`;

const Requirement = styled.li<{ met: boolean }>`
  color: ${props => props.met ? 'var(--accent-color)' : 'var(--dark-grey)'};
  margin-bottom: 4px;
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

const StrengthText = styled.div`
  text-align: right;
  font-size: 12px;
  margin-top: 4px;
  color: var(--dark-grey);
`;

const StrengthLabels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  
  // Password strength requirements state
  const [meetsLength, setMeetsLength] = useState(false);
  const [meetsUppercase, setMeetsUppercase] = useState(false);
  const [meetsLowercase, setMeetsLowercase] = useState(false);
  const [meetsNumber, setMeetsNumber] = useState(false);
  const [meetsSpecial, setMeetsSpecial] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect after successful registration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      
      if (redirectCountdown === 1) {
        navigate('/dashboard');
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [redirectCountdown, navigate]);
  
  // Check password strength when password changes
  useEffect(() => {
    checkPasswordRequirements(password);
  }, [password]);
  
  // Check password requirements
  const checkPasswordRequirements = (pass: string) => {
    setMeetsLength(pass.length >= 12);
    setMeetsUppercase(/[A-Z]/.test(pass));
    setMeetsLowercase(/[a-z]/.test(pass));
    setMeetsNumber(/[0-9]/.test(pass));
    setMeetsSpecial(/[^A-Za-z0-9]/.test(pass));
    
    const strength = getPasswordStrengthLevel(pass);
    setPasswordStrength(strength);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setError('');
    setSuccess('');
    
    // Validate form
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    const validationResult = validatePassword(password);
    if (!validationResult.valid) {
      setError(validationResult.message);
      return;
    }
    
    try {
      setLoading(true);
      
      // Register the user
      const success = await register(email, password, name);
      
      if (success) {
        setSuccess('Registration successful! Redirecting to dashboard...');
        setRedirectCountdown(3);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !redirectCountdown) {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <FormContainer>
      <Title>Create Account</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Name (Optional)</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            required
          />
          
          <StrengthMeter>
            <StrengthIndicator strength={passwordStrength} />
          </StrengthMeter>
          
          <StrengthText>
            {passwordStrength > 0 ? `Password Strength: ${StrengthLabels[passwordStrength - 1]}` : ''}
          </StrengthText>
          
          <PasswordRequirements>
            <Requirement met={meetsLength}>At least 12 characters long</Requirement>
            <Requirement met={meetsUppercase}>At least one uppercase letter</Requirement>
            <Requirement met={meetsLowercase}>At least one lowercase letter</Requirement>
            <Requirement met={meetsNumber}>At least one number</Requirement>
            <Requirement met={meetsSpecial}>At least one special character</Requirement>
          </PasswordRequirements>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </FormGroup>
        
        <Button 
          type="submit" 
          disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword || passwordStrength < 3}
        >
          {loading ? <LoadingSpinner /> : 'Create Account'}
        </Button>
      </Form>
      
      <Footer>
        Already have an account? <StyledLink to="/login">Sign in</StyledLink>
      </Footer>
    </FormContainer>
  );
};

export default RegisterForm; 