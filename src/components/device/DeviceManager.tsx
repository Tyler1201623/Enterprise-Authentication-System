import React, { useEffect, useState } from "react";
import styled from "styled-components";
import deviceManager, { DeviceInfo } from "../../utils/device/deviceManager";

const Container = styled.div`
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
`;

const DeviceList = styled.div`
  margin-bottom: 24px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #718096;
  font-weight: 500;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
`;

const Badge = styled.span<{ type: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.type) {
      case 'success': return '#c6f6d5';
      case 'primary': return '#bee3f8';
      case 'default': return '#e2e8f0';
      default: return '#e2e8f0';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#2f855a';
      case 'primary': return '#2b6cb0';
      case 'default': return '#718096';
      default: return '#718096';
    }
  }};
`;

const Button = styled.button<{ variant?: string }>`
  padding: ${props => props.variant === 'small' ? '6px 12px' : '8px 16px'};
  border-radius: 4px;
  background-color: ${props => {
    if (props.variant === 'outline') return 'transparent';
    return props.color === 'red' ? '#f56565' : '#4299e1';
  }};
  color: ${props => {
    if (props.variant === 'outline') return props.color === 'red' ? '#f56565' : '#4299e1';
    return 'white';
  }};
  border: ${props => {
    if (props.variant === 'outline') return `1px solid ${props.color === 'red' ? '#f56565' : '#4299e1'}`;
    return 'none';
  }};
  cursor: pointer;
  font-weight: 500;
  font-size: ${props => props.variant === 'small' ? '12px' : '14px'};
  margin-right: 8px;
  
  &:hover {
    background-color: ${props => {
      if (props.variant === 'outline') return props.color === 'red' ? 'rgba(245, 101, 101, 0.1)' : 'rgba(66, 153, 225, 0.1)';
      return props.color === 'red' ? '#e53e3e' : '#3182ce';
    }};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e0;
    transition: .4s;
    border-radius: 20px;
  }
  
  span:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + span {
    background-color: #48bb78;
  }
  
  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const Modal = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalBody = styled.div`
  padding: 16px;
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #718096;
  
  &:hover {
    color: #2d3748;
  }
`;

const Text = styled.p<{ size?: string, color?: string, bold?: boolean }>`
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return '14px';
      case 'lg': return '18px';
      default: return '16px';
    }
  }};
  color: ${props => props.color || '#2d3748'};
  font-weight: ${props => props.bold ? '600' : '400'};
  margin: 4px 0;
`;

const DeviceDetail = styled.div`
  margin-bottom: 16px;
`;

const DeviceManager: React.FC = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageType, setMessageType] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  // Load devices on component mount
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = () => {
    const currentDevice = deviceManager.getCurrentDevice();
    setCurrentDeviceId(currentDevice.id);
    setDevices(deviceManager.getAllDevices());
  };

  const handleTrustDevice = (deviceId: string, trusted: boolean) => {
    const isCurrentDevice = deviceId === currentDeviceId;
    
    const success = isCurrentDevice
      ? deviceManager.setDeviceTrusted(deviceManager.getCurrentDevice().id, trusted)
      : deviceManager.setDeviceTrusted(deviceId, trusted);
    
    if (success) {
      loadDevices();
      showMessage(
        trusted ? "success" : "info",
        `Device has been ${trusted ? "added to" : "removed from"} trusted devices.`
      );
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    // Don't allow removing current device
    if (deviceId === currentDeviceId) {
      showMessage(
        "error",
        "You cannot remove your current device. Please use another device to remove this one."
      );
      return;
    }
    
    if (window.confirm("Are you sure you want to remove this device? The user will need to log in again on that device.")) {
      const success = deviceManager.removeDevice(deviceId);
      
      if (success) {
        loadDevices();
        showMessage("success", "Device has been removed successfully.");
        
        // Close modal if the removed device was the selected one
        if (selectedDevice && selectedDevice.id === deviceId) {
          closeModal();
        }
      } else {
        showMessage("error", "Failed to remove the device. Please try again.");
      }
    }
  };

  const handleRemoveAllOtherDevices = () => {
    if (window.confirm("Are you sure you want to remove all other devices? Users will need to log in again on those devices.")) {
      const success = deviceManager.removeAllOtherDevices();
      
      if (success) {
        loadDevices();
        showMessage("success", "All other devices have been removed successfully.");
        closeModal();
      } else {
        showMessage("error", "Failed to remove other devices. Please try again.");
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.toLowerCase().includes("mobile")) return "📱";
    if (deviceType.toLowerCase().includes("tablet")) return "📱";
    if (deviceType.toLowerCase().includes("desktop")) return "🖥️";
    if (deviceType.toLowerCase().includes("laptop")) return "💻";
    return "🔌";
  };

  const viewDeviceDetails = (device: DeviceInfo) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  const showMessage = (type: string, text: string) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => {
      setMessageType(null);
      setMessage("");
    }, 3000);
  };

  return (
    <Container>
      <Header>
        <Title>Device Management</Title>
        <ButtonGroup>
          <Button 
            variant="outline" 
            color="red" 
            onClick={handleRemoveAllOtherDevices}
          >
            Remove All Other Devices
          </Button>
        </ButtonGroup>
      </Header>

      {messageType && message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <DeviceList>
        <Table>
          <thead>
            <tr>
              <Th>Device</Th>
              <Th>Last Seen</Th>
              <Th>Location</Th>
              <Th>Trusted</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <Td>
                  {getDeviceIcon(device.deviceType)} {device.browser} on {device.os} 
                  {device.id === currentDeviceId && (
                    <Badge type="primary" style={{ marginLeft: '8px' }}>Current</Badge>
                  )}
                </Td>
                <Td>{formatDate(device.lastSeen)}</Td>
                <Td>{device.location || "Unknown"}</Td>
                <Td>
                  <Switch>
                    <input
                      type="checkbox"
                      checked={device.trusted}
                      onChange={() => handleTrustDevice(device.id, !device.trusted)}
                    />
                    <span></span>
                  </Switch>
                </Td>
                <Td>
                  <ButtonGroup>
                    <Button 
                      variant="small" 
                      onClick={() => viewDeviceDetails(device)}
                    >
                      Details
                    </Button>
                    {device.id !== currentDeviceId && (
                      <Button 
                        variant="small" 
                        color="red" 
                        onClick={() => handleRemoveDevice(device.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </ButtonGroup>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DeviceList>

      <Modal show={isModalOpen}>
        <ModalContent>
          <ModalHeader>
            <Title>Device Details</Title>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
          </ModalHeader>
          
          {selectedDevice && (
            <>
              <ModalBody>
                <DeviceDetail>
                  <Text size="sm" color="#718096">Device ID</Text>
                  <Text>{selectedDevice.id}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">Browser</Text>
                  <Text>{selectedDevice.browser}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">Operating System</Text>
                  <Text>{selectedDevice.os}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">Device Type</Text>
                  <Text>{selectedDevice.deviceType}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">IP Address</Text>
                  <Text>{selectedDevice.ip || "Unknown"}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">Location</Text>
                  <Text>{selectedDevice.location || "Unknown"}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">First Seen</Text>
                  <Text>{formatDate(selectedDevice.firstSeen)}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">Last Seen</Text>
                  <Text>{formatDate(selectedDevice.lastSeen)}</Text>
                </DeviceDetail>
                
                <DeviceDetail>
                  <Text size="sm" color="#718096">Status</Text>
                  <Badge type={selectedDevice.trusted ? "success" : "default"}>
                    {selectedDevice.trusted ? "Trusted" : "Not Trusted"}
                  </Badge>
                </DeviceDetail>
              </ModalBody>
              
              <ModalFooter>
                <ButtonGroup>
                  <Button 
                    variant="outline" 
                    onClick={() => handleTrustDevice(selectedDevice.id, !selectedDevice.trusted)}
                  >
                    {selectedDevice.trusted ? "Remove Trust" : "Trust Device"}
                  </Button>
                  
                  {selectedDevice.id !== currentDeviceId && (
                    <Button 
                      color="red" 
                      onClick={() => handleRemoveDevice(selectedDevice.id)}
                    >
                      Remove Device
                    </Button>
                  )}
                </ButtonGroup>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default DeviceManager; 