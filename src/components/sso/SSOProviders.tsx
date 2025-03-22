import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import SSOLoginButton from './SSOLoginButton';

const SSOProviders: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Get SSO providers from the utility functions
        const availableProviders = await auth.getSSOProviders();
        setProviders(availableProviders || []);
      } catch (err) {
        console.error("Error loading SSO providers:", err);
        setError("Failed to load login options. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, [auth]);

  const handleSSOLogin = async (providerId: string) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      setActiveProvider(providerId);
      
      const result = await auth.initiateSSOLogin(providerId);
      
      if (!result.success) {
        setError(result.error || "SSO login failed. Please try again.");
        setIsAuthenticating(false);
      }
      // The success case will be handled by the timeout in initiateSSOLogin
      // which will redirect to dashboard
      
    } catch (err) {
      console.error("SSO login error:", err);
      setError("SSO login failed. Please try again or use another method.");
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return <div className="sso-loading">Loading login options...</div>;
  }

  if (isAuthenticating) {
    return (
      <div className="sso-authenticating">
        <LoadingSpinner message={`Authenticating with ${activeProvider}...`} />
      </div>
    );
  }

  if (error) {
    return <div className="sso-error">{error}</div>;
  }

  if (!providers || providers.length === 0) {
    return null; // Don't show the section if no providers
  }

  return (
    <div className="sso-providers-container">
      <div className="sso-divider">
        <span>Or continue with</span>
      </div>
      <div className="sso-buttons-container">
        {providers.map(provider => (
          <SSOLoginButton 
            key={provider.id}
            provider={provider}
            onClick={() => handleSSOLogin(provider.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SSOProviders; 