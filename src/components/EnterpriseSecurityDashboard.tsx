import React, { useState } from "react";
import styled from "styled-components";
import authAnalytics, { AuthEventType } from "../utils/analytics/authAnalytics";
import deviceManager from "../utils/device/deviceManager";
import { createIdentityProvider, SSOProviderType } from "../utils/sso/ssoProvider";
import AuthAnalyticsDashboard from "./analytics/AuthAnalyticsDashboard";
import DeviceManager from "./device/DeviceManager";
import PasswordlessLogin from "./passwordless/PasswordlessLogin";

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 10px 15px;
  background-color: ${props => props.$active ? 'var(--surface-light)' : 'transparent'};
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-primary)'};
  border: none;
  border-bottom: ${props => props.$active ? '2px solid var(--primary-color)' : '2px solid transparent'};
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--surface-light);
  }
`;

const Panel = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const DemoControls = styled.div`
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  margin-right: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3367d6;
  }
`;

const DangerButton = styled(Button)`
  background: #ea4335;

  &:hover {
    background: #d33426;
  }
`;

const Section = styled.section`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
`;

enum DashboardTab {
  OVERVIEW = "overview",
  DEVICES = "devices",
  ANALYTICS = "analytics",
  SSO = "sso",
  PASSWORDLESS = "passwordless",
}

/**
 * Enterprise Security Dashboard Component
 * Demonstrates the enterprise security features implemented
 */
const EnterpriseSecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [demoStatus, setDemoStatus] = useState<string>("");

  // Demo SSO setup by creating a mock identity provider
  const setupDemoSSO = () => {
    const provider = createIdentityProvider({
      name: "Demo Enterprise IdP",
      type: SSOProviderType.SAML,
      enabled: true,
      metadata: {
        entityId: "https://demo-idp.example.com",
        ssoUrl: "https://demo-idp.example.com/sso",
        certificate: "MOCK_CERTIFICATE_DATA",
      },
      attributeMapping: {
        email: "email",
        firstName: "firstName",
        lastName: "lastName",
        role: "role",
      },
    });

    // Log the provider details
    console.log("Created demo SSO provider:", provider);
    
    // Track the event
    authAnalytics.trackAuthEvent(AuthEventType.SSO_INITIATED, {
      metadata: { provider: provider.id }
    });
    
    setDemoStatus("Demo SSO provider created successfully!");
  };

  // Demo a suspicious login attempt
  const simulateSuspiciousLogin = () => {
    // Update device with mock location
    deviceManager.updateCurrentDeviceLocation("Unknown Location");
    
    // Track suspicious login event
    authAnalytics.trackAuthEvent(AuthEventType.LOGIN_FAILURE, {
      email: "user@enterprise.com",
      success: false,
      metadata: {
        reason: "Invalid password attempt",
        attemptCount: 3,
      }
    });
    
    // Track suspicious activity
    authAnalytics.trackAuthEvent(AuthEventType.SUSPICIOUS_ACTIVITY, {
      email: "user@enterprise.com",
      metadata: {
        reason: "Login from unfamiliar location",
        riskLevel: "high",
      }
    });
    
    setDemoStatus("Simulated suspicious login attempts recorded.");
  };

  // Clear all demo data
  const clearDemoData = () => {
    authAnalytics.clearAllEvents();
    localStorage.clear();
    setDemoStatus("All demo data has been cleared!");
  };

  return (
    <Container>
      <Header>
        <Title>Enterprise Security Dashboard</Title>
        <Description>
          Manage and monitor enterprise-grade security features for your application.
        </Description>
      </Header>

      <DemoControls>
        <SectionTitle>Demo Controls</SectionTitle>
        <Button onClick={setupDemoSSO}>Setup Demo SSO Provider</Button>
        <Button onClick={simulateSuspiciousLogin}>Simulate Suspicious Login</Button>
        <DangerButton onClick={clearDemoData}>Clear All Demo Data</DangerButton>
        {demoStatus && <Description>{demoStatus}</Description>}
      </DemoControls>

      <TabContainer>
        <Tab
          $active={activeTab === DashboardTab.OVERVIEW}
          onClick={() => setActiveTab(DashboardTab.OVERVIEW)}
        >
          Security Overview
        </Tab>
        <Tab
          $active={activeTab === DashboardTab.DEVICES}
          onClick={() => setActiveTab(DashboardTab.DEVICES)}
        >
          Device Management
        </Tab>
        <Tab
          $active={activeTab === DashboardTab.ANALYTICS}
          onClick={() => setActiveTab(DashboardTab.ANALYTICS)}
        >
          Security Analytics
        </Tab>
        <Tab
          $active={activeTab === DashboardTab.SSO}
          onClick={() => setActiveTab(DashboardTab.SSO)}
        >
          SSO Configuration
        </Tab>
        <Tab
          $active={activeTab === DashboardTab.PASSWORDLESS}
          onClick={() => setActiveTab(DashboardTab.PASSWORDLESS)}
        >
          Passwordless Auth
        </Tab>
      </TabContainer>

      {activeTab === DashboardTab.OVERVIEW && (
        <Section>
          <SectionTitle>Enterprise Security Features</SectionTitle>
          <Panel>
            <div style={{ padding: "20px" }}>
              <h3>Implemented Features</h3>
              <ul>
                <li><strong>SSO Integration:</strong> SAML, OIDC, and OAuth2 support</li>
                <li><strong>Passwordless Authentication:</strong> Email code and magic link options</li>
                <li><strong>Device Management:</strong> Track and manage trusted devices</li>
                <li><strong>Rate Limiting:</strong> Prevent brute force attacks</li>
                <li><strong>Detailed Analytics:</strong> Monitor authentication events and suspicious activities</li>
              </ul>
              
              <p style={{ marginTop: "20px" }}>
                This dashboard demonstrates enterprise-grade authentication features that can be
                integrated into your application. Use the tabs above to explore each feature.
              </p>
            </div>
          </Panel>
        </Section>
      )}

      {activeTab === DashboardTab.DEVICES && (
        <Section>
          <SectionTitle>Device Management</SectionTitle>
          <DeviceManager />
        </Section>
      )}

      {activeTab === DashboardTab.ANALYTICS && (
        <Section>
          <SectionTitle>Authentication Analytics</SectionTitle>
          <AuthAnalyticsDashboard />
        </Section>
      )}

      {activeTab === DashboardTab.SSO && (
        <Section>
          <SectionTitle>SSO Configuration</SectionTitle>
          <Panel>
            <div style={{ padding: "20px" }}>
              <p>
                To configure SSO for your organization, you need to set up an Identity Provider (IdP).
                Use the "Setup Demo SSO Provider" button in the Demo Controls to create a sample IdP.
              </p>
              
              <h3 style={{ marginTop: "20px" }}>Supported SSO Protocols</h3>
              <ul>
                <li><strong>SAML 2.0:</strong> For enterprise identity providers</li>
                <li><strong>OpenID Connect:</strong> For modern authentication flows</li>
                <li><strong>OAuth 2.0:</strong> For authorization with third-party providers</li>
              </ul>
              
              <h3 style={{ marginTop: "20px" }}>Domain Enforcement</h3>
              <p>
                The following email domains are configured to require SSO:
              </p>
              <ul>
                <li>enterprise.com</li>
                <li>corporate.org</li>
              </ul>
              <p>
                Users with email addresses from these domains will be automatically 
                redirected to SSO login.
              </p>
            </div>
          </Panel>
        </Section>
      )}

      {activeTab === DashboardTab.PASSWORDLESS && (
        <Section>
          <SectionTitle>Passwordless Authentication</SectionTitle>
          <Panel>
            <div style={{ padding: "20px" }}>
              <p>
                Try our passwordless authentication option. You can use either an email code
                or a magic link to sign in without a password.
              </p>
              
              <div style={{ maxWidth: "450px", margin: "20px auto" }}>
                <PasswordlessLogin
                  onLoginSuccess={(identifier) => {
                    authAnalytics.trackAuthEvent(AuthEventType.PASSWORDLESS_SUCCESS, {
                      email: identifier,
                      success: true
                    });
                    setDemoStatus(`Passwordless login successful for ${identifier}`);
                  }}
                  onCancel={() => {
                    setDemoStatus("Passwordless login cancelled");
                  }}
                />
              </div>
            </div>
          </Panel>
        </Section>
      )}
    </Container>
  );
};

export default EnterpriseSecurityDashboard; 