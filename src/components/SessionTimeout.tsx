import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuthContext } from '../hooks/useAuthContext';

const WarningContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--warning-color);
  color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: var(--shadow-2);
  max-width: 350px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const Message = styled.p`
  margin: 0 0 15px 0;
  font-size: 14px;
  line-height: 1.4;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
`;

const ExtendButton = styled(Button)`
  background-color: white;
  color: var(--warning-color);
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const LogoutButton = styled(Button)`
  background-color: transparent;
  color: white;
  border: 1px solid white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ProgressBar = styled.div`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: 15px;
  overflow: hidden;
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  background-color: white;
  width: ${props => props.width}%;
  transition: width 1s linear;
`;

const SESSION_WARNING_MS = 5 * 60 * 1000; // 5 minutes 
const POLLING_INTERVAL_MS = 1000; // Check session every second

const SessionTimeoutDialog: React.FC<{
  timeLeft: number;
  onExtend: () => void;
  onClose: () => void;
}> = ({ timeLeft, onExtend, onClose }) => {
  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="session-timeout-dialog">
      <div className="session-timeout-content">
        <h3>Session Timeout Warning</h3>
        <p>Your session will expire in {formatTimeLeft(timeLeft)}.</p>
        <p>Do you want to extend your session?</p>
        
        <div className="dialog-buttons">
          <button 
            className="btn btn-primary" 
            onClick={onExtend}
          >
            Extend Session
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionTimeout: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { logout, isAuthenticated, getSessionTimeRemaining, extendSession } = useAuthContext();
  
  useEffect(() => {
    // Only proceed if user is authenticated and session methods exist
    if (!isAuthenticated || !getSessionTimeRemaining) {
      return;
    }
    
    // Check session time every second
    const interval = setInterval(() => {
      const secondsLeft = getSessionTimeRemaining();
      
      // Show warning if less than threshold time remaining (5 minutes)
      if (secondsLeft > 0 && secondsLeft <= 300) {
        setVisible(true);
        setTimeLeft(secondsLeft * 1000); // Convert to ms for UI
      } else if (secondsLeft <= 0) {
        // Session expired, logout the user
        clearInterval(interval);
        logout();
      } else {
        // Not in warning period yet
        setVisible(false);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getSessionTimeRemaining, logout, isAuthenticated]);

  const handleExtendSession = () => {
    if (extendSession) {
      extendSession();
    }
    setVisible(false);
  };
  
  // If user is not authenticated, don't render anything
  if (!isAuthenticated) {
    return null;
  }
  
  // If session methods are missing, don't render anything
  if (!getSessionTimeRemaining || !extendSession) {
    console.warn('Session timeout monitoring unavailable: missing required methods');
    return null;
  }
  
  // If not in warning state, don't render anything
  if (!visible) {
    return null;
  }
  
  return (
    <div className="session-timeout-container">
      <SessionTimeoutDialog 
        timeLeft={timeLeft}
        onExtend={handleExtendSession}
        onClose={logout}
      />
    </div>
  );
};

export default SessionTimeout; 