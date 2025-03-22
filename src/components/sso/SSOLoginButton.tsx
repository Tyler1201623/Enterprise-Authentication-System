import React from "react";
import styled from "styled-components";
import { IdentityProviderConfig, SSOProviderType } from "../../utils/sso/ssoProvider";

const Button = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  text-align: left;
  margin-bottom: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const GoogleButton = styled(Button)`
  border-color: #4285f4;
  color: #4285f4;
  
  &:hover {
    background-color: rgba(66, 133, 244, 0.05);
  }
`;

const MicrosoftButton = styled(Button)`
  border-color: #00a4ef;
  color: #00a4ef;
  
  &:hover {
    background-color: rgba(0, 164, 239, 0.05);
  }
`;

const OktaButton = styled(Button)`
  border-color: #007dc1;
  color: #007dc1;
  
  &:hover {
    background-color: rgba(0, 125, 193, 0.05);
  }
`;

const GithubButton = styled(Button)`
  border-color: #333;
  color: #333;
  
  &:hover {
    background-color: rgba(51, 51, 51, 0.05);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const DividerText = styled.span`
  padding: 0 10px;
  color: #718096;
  font-size: 14px;
`;

const ProvidersContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 16px;
`;

const Icon = styled.span`
  margin-right: 10px;
  font-size: 18px;
`;

// Provider icons based on type
const getProviderIcon = (provider: any): string => {
  // Use custom icons for specific providers based on name
  const name = provider.name.toLowerCase();
  
  if (name.includes('google')) return "🔍";
  if (name.includes('github')) return "🐱";
  if (name.includes('microsoft')) return "🪟";
  if (name.includes('facebook')) return "👍";
  if (name.includes('apple')) return "🍎";
  if (name.includes('twitter')) return "🐦";
  if (name.includes('linkedin')) return "💼";
  
  // Use type-based icons as fallback
  switch (provider.type) {
    case SSOProviderType.SAML:
      return "🔐";
    case SSOProviderType.OIDC:
      return "🔄";
    case SSOProviderType.OAUTH2:
      return "🔑";
    default:
      return "🔑";
  }
};

// Provider colors based on name
const getProviderColor = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('google')) return "#4285f4";
  if (lowerName.includes('github')) return "#333";
  if (lowerName.includes('microsoft')) return "#00a4ef";
  if (lowerName.includes('facebook')) return "#3b5998";
  if (lowerName.includes('apple')) return "#000000";
  if (lowerName.includes('twitter')) return "#1da1f2";
  if (lowerName.includes('linkedin')) return "#0077b5";
  if (lowerName.includes('okta')) return "#007dc1";
  
  return "#718096"; // Default color
};

interface SSOLoginButtonProps {
  provider: any;
  onClick: () => void;
}

const SSOLoginButton: React.FC<SSOLoginButtonProps> = ({ provider, onClick }) => {
  const providerColor = getProviderColor(provider.name);
  const icon = getProviderIcon(provider);
  
  return (
    <button 
      className="sso-provider-button"
      onClick={onClick}
      style={{ 
        '--provider-color': providerColor,
        borderColor: providerColor,
        color: providerColor
      } as React.CSSProperties}
    >
      <span className="provider-icon">{icon}</span>
      <span className="provider-name">Continue with {provider.name}</span>
    </button>
  );
};

interface SSOProviderListProps {
  providers: IdentityProviderConfig[];
  onLoginClick?: (providerId: string) => void;
}

export const SSOProviderList: React.FC<SSOProviderListProps> = ({
  providers,
  onLoginClick,
}) => {
  if (!providers || providers.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Single Sign-On</h2>
        <p>No SSO providers are configured. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">Single Sign-On</h2>
      <p className="text-sm text-gray">Sign in with your organization credentials</p>
      
      <ProvidersContainer>
        {providers.map((provider) => (
          <SSOLoginButton
            key={provider.id}
            provider={provider}
            onClick={() => onLoginClick && onLoginClick(provider.id)}
          />
        ))}
      </ProvidersContainer>
    </div>
  );
};

export default SSOLoginButton; 