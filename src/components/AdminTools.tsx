import React, { useState } from 'react';
import styled from 'styled-components';
import { createUser, deleteAllAccounts, makeUserAdmin } from '../utils/database';

const ToolsContainer = styled.div`
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-right: 10px;
  
  &:hover {
    background-color: #b71c1c;
  }
`;

const Message = styled.div<{ type: 'success' | 'error' }>`
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  background-color: ${props => props.type === 'success' ? '#e8f5e9' : '#ffebee'};
  color: ${props => props.type === 'success' ? '#2e7d32' : '#d32f2f'};
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
`;

const AdminTools: React.FC = () => {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [email, setEmail] = useState('keeseetyler@yahoo.com');
  const [password, setPassword] = useState('admin123');

  const handleResetDatabase = () => {
    try {
      // Clear all accounts
      const success = deleteAllAccounts();
      
      if (!success) {
        setMessage({ text: 'Failed to reset database', type: 'error' });
        return;
      }
      
      // Create a new admin account
      const user = createUser(email, password);
      
      if (!user) {
        setMessage({ text: 'Failed to create admin account', type: 'error' });
        return;
      }
      
      // Ensure admin privileges
      makeUserAdmin(email);
      
      setMessage({ 
        text: `Database reset successful! Admin account created: ${email}`, 
        type: 'success' 
      });
      
      // Reload after 2 seconds to refresh the app state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setMessage({ 
        text: `Error: ${(error as Error).message}`, 
        type: 'error' 
      });
    }
  };

  return (
    <ToolsContainer>
      <Title>Admin Tools</Title>
      
      <div>
        <h3>Reset Database</h3>
        <p>This will delete all accounts and create a new admin account.</p>
        
        <InputGroup>
          <Label>Admin Email:</Label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <Label>Admin Password:</Label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
        </InputGroup>
        
        <Button onClick={handleResetDatabase}>
          Reset Database & Create Admin
        </Button>
      </div>
      
      {message && (
        <Message type={message.type}>
          {message.text}
        </Message>
      )}
    </ToolsContainer>
  );
};

export default AdminTools; 