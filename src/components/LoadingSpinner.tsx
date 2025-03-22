import React from 'react';
import styled from 'styled-components';

// Use transform for animations instead of dimensions for better performance
const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  will-change: transform; /* Hint to browser for optimization */
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
  margin-bottom: 15px;
  will-change: transform; /* Hardware acceleration */
  transform: translateZ(0); /* Force GPU rendering */
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Text = styled.p`
  color: var(--dark-grey);
  font-size: 16px;
  font-weight: 500;
`;

// Move container outside of the component function for better memory usage
const FullPageContainer = styled.div<{ $fullPage: boolean }>`
  position: ${props => props.$fullPage ? 'fixed' : 'static'};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.$fullPage ? 'rgba(255, 255, 255, 0.8)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: ${props => props.$fullPage ? 'all' : 'none'};
`;

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

// Memoize the component to prevent unnecessary re-renders
const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ 
  message = 'Loading...', 
  fullPage = false 
}) => {
  return (
    <FullPageContainer $fullPage={fullPage}>
      <SpinnerContainer>
        <Spinner />
        <Text>{message}</Text>
      </SpinnerContainer>
    </FullPageContainer>
  );
});

// Set display name for debugging
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 