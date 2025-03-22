import React, { useEffect, useState } from "react";
import styled from "styled-components";
import authAnalytics, {
    AuthEvent,
    AuthEventType,
} from "../../utils/analytics/authAnalytics";

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

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 10px 16px;
  background: none;
  border: none;
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  border-bottom: ${props => props.$active ? '2px solid var(--primary-color)' : 'none'};
  cursor: pointer;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #718096;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
`;

const StatHelp = styled.div`
  font-size: 12px;
  color: #a0aec0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  background-color: white;
  min-width: 200px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${props => props.color === 'red' ? '#f56565' : '#4299e1'};
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => props.color === 'red' ? '#e53e3e' : '#3182ce'};
  }
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
      case 'error': return '#fed7d7';
      case 'warning': return '#feebc8';
      default: return '#e2e8f0';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#2f855a';
      case 'error': return '#c53030';
      case 'warning': return '#c05621';
      default: return '#718096';
    }
  }};
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: #718096;
`;

const TabPanel = styled.div<{ $active: boolean }>`
  display: ${props => props.$active ? 'block' : 'none'};
  margin-top: 20px;
`;

const AuthAnalyticsDashboard: React.FC = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuthEvent[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSuccess, setFilterSuccess] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [successRate, setSuccessRate] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    setFilteredEvents(applyFilters(events, filterType, filterSuccess));
    // Calculate success rate
    setSuccessRate(authAnalytics.calculateSuccessRate());
  }, [events, filterType, filterSuccess]);

  const loadEvents = () => {
    const allEvents = authAnalytics.getAllEvents();
    setEvents(allEvents);
    setLoading(false);
  };

  const applyFilters = (
    eventList: AuthEvent[],
    type: string,
    success: string
  ): AuthEvent[] => {
    return eventList.filter((event) => {
      // Filter by type
      if (type !== "all" && event.type !== type) {
        return false;
      }

      // Filter by success
      if (success === "success" && event.success !== true) {
        return false;
      } else if (success === "failure" && event.success !== false) {
        return false;
      }

      return true;
    });
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  };

  const handleFilterSuccessChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterSuccess(e.target.value);
  };

  const handleClearEvents = () => {
    if (window.confirm("Are you sure you want to clear all analytics data? This cannot be undone.")) {
      authAnalytics.clearAllEvents();
      setEvents([]);
      setFilteredEvents([]);
      setSuccessRate(0);
      alert("Analytics data has been cleared successfully.");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventIcon = (type: AuthEventType): string => {
    switch (type) {
      case AuthEventType.LOGIN_SUCCESS:
        return "✅";
      case AuthEventType.LOGIN_FAILURE:
        return "❌";
      case AuthEventType.LOGOUT:
        return "🚪";
      case AuthEventType.REGISTRATION:
        return "📝";
      case AuthEventType.PASSWORD_RESET:
      case AuthEventType.PASSWORD_RESET_REQUEST:
      case AuthEventType.PASSWORD_RESET_COMPLETE:
      case AuthEventType.PASSWORD_CHANGE:
        return "🔑";
      case AuthEventType.MFA_ENABLED:
      case AuthEventType.MFA_DISABLED:
      case AuthEventType.MFA_SUCCESS:
      case AuthEventType.MFA_FAILURE:
        return "🔐";
      case AuthEventType.SSO_INITIATED:
      case AuthEventType.SSO_SUCCESS:
      case AuthEventType.SSO_FAILURE:
        return "🔄";
      case AuthEventType.PASSWORDLESS_INITIATED:
      case AuthEventType.PASSWORDLESS_SUCCESS:
      case AuthEventType.PASSWORDLESS_FAILURE:
        return "📱";
      case AuthEventType.ACCOUNT_LOCKED:
        return "🔒";
      case AuthEventType.ACCOUNT_UNLOCKED:
        return "🔓";
      case AuthEventType.SUSPICIOUS_ACTIVITY:
        return "⚠️";
      case AuthEventType.SESSION_EXTENDED:
      case AuthEventType.SESSION_EXPIRED:
        return "⏱️";
      case AuthEventType.DEVICE_ADDED:
      case AuthEventType.DEVICE_REMOVED:
      case AuthEventType.DEVICE_TRUSTED:
      case AuthEventType.DEVICE_UNTRUSTED:
        return "💻";
      default:
        return "📊";
    }
  };

  const getEventTypeName = (type: AuthEventType): string => {
    // Convert from camelCase to Title Case with spaces
    return type.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

  const getTotalEventCount = (type?: AuthEventType): number => {
    if (type) {
      return events.filter((e) => e.type === type).length;
    }
    return events.length;
  };

  const getSuccessfulEventCount = (type?: AuthEventType): number => {
    let filtered = events;
    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }
    return filtered.filter((e) => e.success === true).length;
  };

  const getSuccessRateByType = (type: AuthEventType): number => {
    const typeEvents = events.filter((e) => e.type === type);
    if (typeEvents.length === 0) return 0;
    const successful = typeEvents.filter((e) => e.success === true).length;
    return (successful / typeEvents.length) * 100;
  };

  const renderEventDetails = (event: AuthEvent) => {
    return (
      <>
        <strong>Type:</strong> {getEventTypeName(event.type)}<br />
        <strong>User:</strong> {event.email || 'Unknown'}<br />
        <strong>Device:</strong> {event.deviceInfo?.browser || 'Unknown'} / {event.deviceInfo?.os || 'Unknown'}<br />
        {event.ip && <><strong>IP:</strong> {event.ip}<br /></>}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <>
            <strong>Details:</strong><br />
            <pre style={{ fontSize: '12px' }}>
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </>
        )}
      </>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Authentication Analytics</Title>
        <Button color="red" onClick={handleClearEvents}>
          Clear All Data
        </Button>
      </Header>

      <TabList>
        <Tab 
          $active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Tab>
        <Tab 
          $active={activeTab === "eventLog"}
          onClick={() => setActiveTab("eventLog")}
        >
          Event Log
        </Tab>
      </TabList>

      <TabPanel $active={activeTab === "overview"}>
        <Grid>
          <StatCard>
            <StatLabel>Login Success Rate</StatLabel>
            <StatValue>{successRate.toFixed(0)}%</StatValue>
            <StatHelp>Overall success rate</StatHelp>
          </StatCard>
          <StatCard>
            <StatLabel>Total Authentication Events</StatLabel>
            <StatValue>{getTotalEventCount()}</StatValue>
            <StatHelp>{getSuccessfulEventCount()} successful</StatHelp>
          </StatCard>
          <StatCard>
            <StatLabel>Suspicious Activities</StatLabel>
            <StatValue>{authAnalytics.getSuspiciousEvents().length}</StatValue>
            <StatHelp>Potential security issues</StatHelp>
          </StatCard>
        </Grid>

        <div>
          <Title style={{ fontSize: '16px', marginBottom: '12px' }}>Event Success Rates</Title>
          <Table>
            <thead>
              <tr>
                <Th>Event Type</Th>
                <Th>Count</Th>
                <Th>Success Rate</Th>
              </tr>
            </thead>
            <tbody>
              {Object.values(AuthEventType)
                .filter(type => getTotalEventCount(type as AuthEventType) > 0)
                .map((type) => (
                  <tr key={type}>
                    <Td>
                      {getEventIcon(type as AuthEventType)} {getEventTypeName(type as AuthEventType)}
                    </Td>
                    <Td>{getTotalEventCount(type as AuthEventType)}</Td>
                    <Td>
                      <Badge 
                        type={getSuccessRateByType(type as AuthEventType) >= 80 ? 'success' : 
                              getSuccessRateByType(type as AuthEventType) >= 50 ? 'warning' : 'error'}
                      >
                        {getSuccessRateByType(type as AuthEventType).toFixed(0)}%
                      </Badge>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      </TabPanel>

      <TabPanel $active={activeTab === "eventLog"}>
        <FilterContainer>
          <Select value={filterType} onChange={handleFilterTypeChange}>
            <option value="all">All Event Types</option>
            {Object.values(AuthEventType).map((type) => (
              <option key={type} value={type}>
                {getEventTypeName(type as AuthEventType)}
              </option>
            ))}
          </Select>
          <Select value={filterSuccess} onChange={handleFilterSuccessChange}>
            <option value="all">All Results</option>
            <option value="success">Successful Only</option>
            <option value="failure">Failed Only</option>
          </Select>
        </FilterContainer>

        {filteredEvents.length === 0 ? (
          <EmptyState>
            No events found matching your filters.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Event</Th>
                <Th>User</Th>
                <Th>Status</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <Td>{formatDate(event.timestamp)}</Td>
                  <Td>
                    {getEventIcon(event.type)} {getEventTypeName(event.type)}
                  </Td>
                  <Td>{event.email || "-"}</Td>
                  <Td>
                    <Badge type={event.success === true ? "success" : event.success === false ? "error" : "default"}>
                      {event.success === true ? "Success" : event.success === false ? "Failed" : "Info"}
                    </Badge>
                  </Td>
                  <Td>{renderEventDetails(event)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TabPanel>
    </Container>
  );
};

export default AuthAnalyticsDashboard; 