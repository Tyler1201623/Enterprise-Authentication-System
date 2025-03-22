import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import useAuthContext from '../hooks/useAuthContext';
import { disableMFA, enableMFA, updateUser, verifyPassword } from '../utils/database';
import deviceManager from '../utils/device/deviceManager';
import AdminDashboard from './AdminDashboard';
import LoadingSpinner from './LoadingSpinner';

// Styled components for the profile page
const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProfilePictureContainer = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #4285f4;
`;

const ProfilePicture = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfilePictureUpload = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  cursor: pointer;
  font-size: 0.8rem;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const TabContainer = styled.div`
  margin-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  overflow-x: auto;
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => (props.active ? '#4285f4' : 'transparent')};
  color: ${props => (props.active ? 'white' : '#333')};
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px 4px 0 0;
  font-weight: ${props => (props.active ? 'bold' : 'normal')};
  
  &:hover {
    background: ${props => (props.active ? '#4285f4' : '#f0f0f0')};
  }
`;

const TabContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    border-color: #4285f4;
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }
`;

const Button = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  
  &:hover {
    background: #3367d6;
  }
  
  &:disabled {
    background: #9aa0a6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: #4285f4;
  border: 1px solid #4285f4;
  
  &:hover {
    background: #f6fafe;
  }
`;

const DangerButton = styled(Button)`
  background: #ea4335;
  
  &:hover {
    background: #d33426;
  }
`;

const CardSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #202124;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  color: #ea4335;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  color: #34a853;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(52, 168, 83, 0.1);
`;

const DeviceList = styled.div`
  margin-top: 1rem;
`;

const DeviceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
`;

const Badge = styled.span`
  background: #f6fafe;
  color: #4285f4;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

// Main user profile component
export default function UserProfile() {
  const { user, updateUser: updateAuthUser, refreshUser } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // Load user devices
  useEffect(() => {
    if (user) {
      // In a real app, this would fetch from the database
      // For this demo, we'll use local data
      setDevices(deviceManager.getAllDevices());
    }
  }, [user]);

  if (!user) {
    navigate('/auth');
    return <LoadingSpinner message="Redirecting to login..." />;
  }

  if (user.isAdmin) {
    return <AdminDashboard />;
  }

  // Handle profile picture upload
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProfileImage(e.target.result as string);
        
        // In a real app, we would upload this to a server
        // For the demo, we'll update the user object locally
        handleUpdateProfile({
          profileImage: e.target.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle personal info update
  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    handleUpdateProfile({
      name: name
    });
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, we would verify with the server
      // For demo, we'll use the utility function
      const passwordCorrect = await verifyPassword(user.email, currentPassword, user.passwordHash);
      
      if (!passwordCorrect) {
        setError('Current password is incorrect');
        return;
      }
      
      // Update password
      await updateUser(user.id, {
        passwordHash: newPassword // The updateUser function will hash this
      });
      
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA toggle
  const handleMfaToggle = async () => {
    if (user.mfaEnabled) {
      // Disable MFA
      try {
        setLoading(true);
        await disableMFA(user.id);
        await refreshUser();
        setSuccess('MFA disabled successfully');
      } catch (err) {
        setError('Failed to disable MFA');
      } finally {
        setLoading(false);
      }
    } else {
      // Show MFA setup
      setShowMfaSetup(true);
      // In a real app, we would get this from the server
      setMfaSecret(`MFASECRET${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    }
  };

  // Handle MFA verification
  const handleMfaVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, we would verify with the server
      // For the demo, we'll allow any 6-digit code
      await enableMFA(user.id, mfaSecret, []);
      await refreshUser();
      setSuccess('MFA enabled successfully');
      setShowMfaSetup(false);
      setMfaCode('');
    } catch (err) {
      setError('Failed to verify MFA code');
    } finally {
      setLoading(false);
    }
  };

  // Handle device management
  const handleRemoveDevice = async (deviceId: string) => {
    setLoading(true);
    
    try {
      // In a real app, we would call the API
      // For the demo, we'll use the device manager
      deviceManager.removeDevice(deviceId);
      setDevices(deviceManager.getAllDevices());
      setSuccess('Device removed successfully');
    } catch (err) {
      setError('Failed to remove device');
    } finally {
      setLoading(false);
    }
  };

  // Handle trust/untrust device
  const handleToggleTrustDevice = async (deviceId: string, trusted: boolean) => {
    setLoading(true);
    
    try {
      // In a real app, we would call the API
      // For the demo, we'll use the device manager
      deviceManager.setDeviceTrusted(deviceId, trusted);
      setDevices(deviceManager.getAllDevices());
      setSuccess(`Device ${trusted ? 'trusted' : 'untrusted'} successfully`);
    } catch (err) {
      setError(`Failed to ${trusted ? 'trust' : 'untrust'} device`);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const handleUpdateProfile = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would call the API
      // For the demo, we'll update the local user object
      await updateAuthUser({
        ...data
      });
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get avatar placeholder if no profile image
  const getAvatarPlaceholder = () => {
    if (profileImage) return null;
    return name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfilePictureContainer>
          {profileImage ? (
            <ProfilePicture src={profileImage} alt="Profile" />
          ) : (
            <div style={{ fontSize: '3rem', color: '#4285f4' }}>{getAvatarPlaceholder()}</div>
          )}
          <ProfilePictureUpload onClick={() => fileInputRef.current?.click()}>
            Change Photo
          </ProfilePictureUpload>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleProfilePictureUpload}
          />
        </ProfilePictureContainer>
        
        <ProfileInfo>
          <h1>{name || user.email}</h1>
          <p>{user.email}</p>
          <p>
            Account Type: {user.role || 'User'}
            {user.mfaEnabled && <Badge>MFA Enabled</Badge>}
          </p>
          <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
        </ProfileInfo>
      </ProfileHeader>

      <TabContainer>
        <Tab 
          active={activeTab === 'personal'} 
          onClick={() => setActiveTab('personal')}
        >
          Personal Information
        </Tab>
        <Tab 
          active={activeTab === 'security'} 
          onClick={() => setActiveTab('security')}
        >
          Security Settings
        </Tab>
        <Tab 
          active={activeTab === 'devices'} 
          onClick={() => setActiveTab('devices')}
        >
          Trusted Devices
        </Tab>
      </TabContainer>

      <TabContent>
        {/* Success and error messages */}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <form onSubmit={handlePersonalInfoSubmit}>
            <CardSection>
              <CardTitle>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#4285f4"/>
                </svg>
                Basic Information
              </CardTitle>
              
              <FormGroup>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  placeholder="Your email address"
                />
                <small style={{ color: '#5f6368' }}>Email cannot be changed</small>
              </FormGroup>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Save Changes'}
              </Button>
            </CardSection>
          </form>
        )}
        
        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <>
            <CardSection>
              <CardTitle>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="#4285f4"/>
                </svg>
                Change Password
              </CardTitle>
              
              <form onSubmit={handlePasswordChange}>
                <FormGroup>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </FormGroup>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </CardSection>
            
            <CardSection>
              <CardTitle>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="#4285f4"/>
                </svg>
                Multi-Factor Authentication
              </CardTitle>
              
              {showMfaSetup ? (
                <div>
                  <p>Set up MFA using an authenticator app:</p>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/EnterpriseAuth:${user.email}?secret=${mfaSecret}&issuer=EnterpriseAuth`}
                      alt="QR Code"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                  
                  <p>Or enter the secret key manually: <strong>{mfaSecret}</strong></p>
                  
                  <FormGroup>
                    <Label htmlFor="mfaCode">Enter 6-digit verification code</Label>
                    <Input
                      id="mfaCode"
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                    />
                  </FormGroup>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={handleMfaVerify} disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                    <SecondaryButton 
                      onClick={() => setShowMfaSetup(false)} 
                      disabled={loading}
                    >
                      Cancel
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <div>
                  <p>
                    {user.mfaEnabled 
                      ? 'Multi-Factor Authentication is currently enabled for your account.' 
                      : 'Multi-Factor Authentication adds an extra layer of security to your account.'}
                  </p>
                  
                  <Button onClick={handleMfaToggle} disabled={loading}>
                    {loading ? 'Processing...' : (user.mfaEnabled ? 'Disable MFA' : 'Enable MFA')}
                  </Button>
                </div>
              )}
            </CardSection>
          </>
        )}
        
        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <CardSection>
            <CardTitle>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 1.01L7 1C5.9 1 5 1.9 5 3V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V3C19 1.9 18.1 1.01 17 1.01ZM17 19H7V5H17V19Z" fill="#4285f4"/>
              </svg>
              Manage Devices
            </CardTitle>
            
            <p>These devices have been used to access your account:</p>
            
            <DeviceList>
              {devices.length > 0 ? (
                devices.map((device: any) => (
                  <DeviceItem key={device.id}>
                    <div>
                      <div><strong>{device.name || device.browser}</strong></div>
                      <div style={{ fontSize: '0.9rem', color: '#5f6368' }}>
                        {device.os} • Last used {new Date(device.lastSeen).toLocaleDateString()}
                      </div>
                      {device.current && <Badge>Current Device</Badge>}
                      {device.trusted && <Badge>Trusted</Badge>}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!device.current && (
                        <>
                          {device.trusted ? (
                            <SecondaryButton 
                              onClick={() => handleToggleTrustDevice(device.id, false)}
                              disabled={loading}
                            >
                              Untrust
                            </SecondaryButton>
                          ) : (
                            <SecondaryButton 
                              onClick={() => handleToggleTrustDevice(device.id, true)}
                              disabled={loading}
                            >
                              Trust
                            </SecondaryButton>
                          )}
                          
                          <DangerButton 
                            onClick={() => handleRemoveDevice(device.id)}
                            disabled={loading}
                          >
                            Remove
                          </DangerButton>
                        </>
                      )}
                    </div>
                  </DeviceItem>
                ))
              ) : (
                <p>No devices found.</p>
              )}
            </DeviceList>
          </CardSection>
        )}
      </TabContent>
    </ProfileContainer>
  );
} 