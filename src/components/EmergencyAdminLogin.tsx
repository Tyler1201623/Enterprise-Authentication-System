import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ensureAdminAccess } from '../utils/database';

// Modal container with overlay
const ModalOverlay = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => (props.show ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${props => (props.show ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

const EmergencyContainer = styled.div`
  padding: 25px;
  max-width: 500px;
  background-color: #fff8f8;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);
  text-align: center;
  border: 2px dashed #d32f2f;
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background-color: #d32f2f;
  }
`;

const Title = styled.h2`
  color: #d32f2f;
  margin-bottom: 15px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before, &::after {
    content: '⚠️';
    margin: 0 10px;
  }
`;

const Description = styled.p`
  color: #555;
  margin-bottom: 20px;
  font-size: 1rem;
  line-height: 1.5;
`;

const Button = styled.button`
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #b71c1c;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(183, 28, 28, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  
  &:hover {
    color: #333;
  }
`;

const Message = styled.div<{ success: boolean }>`
  margin-top: 15px;
  padding: 15px;
  border-radius: 4px;
  background-color: ${props => props.success ? '#e8f5e9' : '#ffebee'};
  color: ${props => props.success ? '#2e7d32' : '#d32f2f'};
  font-weight: 500;
  border-left: 4px solid ${props => props.success ? '#2e7d32' : '#d32f2f'};
`;

// Define function to show the EmergencyAdminLogin modal
let showEmergencyAdminLoginFn: (() => void) | null = null;

// Public function that can be called from anywhere to show the modal
export function showEmergencyAdminLogin() {
  if (showEmergencyAdminLoginFn) {
    showEmergencyAdminLoginFn();
  } else {
    console.warn('Emergency admin login not initialized yet');
  }
}

const EmergencyAdminLogin: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  
  // Register the show function when component mounts
  useEffect(() => {
    showEmergencyAdminLoginFn = () => setVisible(true);
    
    return () => {
      showEmergencyAdminLoginFn = null;
    };
  }, []);
  
  const handleClose = () => {
    setVisible(false);
    setMessage(null);
  };
  
  const handleEmergencyAccess = () => {
    try {
      const adminEmail = 'keeseetyler@yahoo.com';
      const user = ensureAdminAccess(adminEmail);
      
      if (!user) {
        setMessage({
          text: 'Failed to create emergency admin access. Check console for details.',
          success: false
        });
        return;
      }
      
      setMessage({
        text: `Emergency admin access granted for ${adminEmail}! The application will reload in 2 seconds.`,
        success: true
      });
      
      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setMessage({
        text: `Error: ${(error as Error).message}`,
        success: false
      });
    }
  };
  
  // If not visible, render nothing
  if (!visible) {
    return null;
  }
  
  return (
    <ModalOverlay show={visible} onClick={handleClose}>
      <EmergencyContainer onClick={e => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>×</CloseButton>
        <Title>Emergency Admin Access</Title>
        <Description>
          This will create or restore admin access for keeseetyler@yahoo.com.
          This special access is restricted to authorized personnel only.
        </Description>
        
        <Button onClick={handleEmergencyAccess}>
          Grant Emergency Admin Access
        </Button>
        
        {message && (
          <Message success={message.success}>
            {message.text}
          </Message>
        )}
      </EmergencyContainer>
    </ModalOverlay>
  );
};

export default EmergencyAdminLogin; 