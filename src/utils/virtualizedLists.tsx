import React from "react";
import { FixedSizeList as List } from "react-window";
import { LogRecord, UserRecord } from "./database";

/**
 * Props for the VirtualizedUserList component
 */
export interface VirtualizedUserListProps {
  users: UserRecord[];
  height: number;
  width: number;
  itemHeight?: number;
  onUserClick?: (user: UserRecord) => void;
}

/**
 * A virtualized list component for efficient rendering of large user lists
 */
export const VirtualizedUserList: React.FC<VirtualizedUserListProps> = ({
  users,
  height,
  width,
  itemHeight = 50,
  onUserClick,
}) => {
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const user = users[index];

    return (
      <div
        className="virtualized-user-row"
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid #e5e7eb",
          cursor: onUserClick ? "pointer" : "default",
        }}
        onClick={() => onUserClick && onUserClick(user)}
      >
        <div style={{ flex: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
          {user.email}
        </div>
        <div style={{ flex: 1 }}>{user.role}</div>
        <div style={{ flex: 1 }}>
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
        <div style={{ flex: 1 }}>
          {user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString()
            : "Never"}
        </div>
      </div>
    );
  };

  return (
    <div className="virtualized-list-container">
      <div
        className="virtualized-header"
        style={{
          display: "flex",
          padding: "0 16px",
          height: 40,
          alignItems: "center",
          fontWeight: "bold",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <div style={{ flex: 2 }}>Email</div>
        <div style={{ flex: 1 }}>Role</div>
        <div style={{ flex: 1 }}>Created</div>
        <div style={{ flex: 1 }}>Last Login</div>
      </div>
      <List
        height={height - 40} // subtract header height
        width={width}
        itemCount={users.length}
        itemSize={itemHeight}
      >
        {Row}
      </List>
    </div>
  );
};

/**
 * Props for the VirtualizedLogList component
 */
export interface VirtualizedLogListProps {
  logs: LogRecord[];
  height: number;
  width: number;
  itemHeight?: number;
  onLogClick?: (log: LogRecord) => void;
}

/**
 * A virtualized list component for efficient rendering of large log lists
 */
export const VirtualizedLogList: React.FC<VirtualizedLogListProps> = ({
  logs,
  height,
  width,
  itemHeight = 50,
  onLogClick,
}) => {
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const log = logs[index];

    return (
      <div
        className="virtualized-log-row"
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid #e5e7eb",
          cursor: onLogClick ? "pointer" : "default",
        }}
        onClick={() => onLogClick && onLogClick(log)}
      >
        <div style={{ flex: 2 }}>
          {new Date(log.timestamp).toLocaleString()}
        </div>
        <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {log.user || "System"}
        </div>
        <div style={{ flex: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
          {log.action}
        </div>
        <div style={{ flex: 1 }}>
          <span className={`log-level ${log.level}`}>{log.level}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="virtualized-list-container">
      <div
        className="virtualized-header"
        style={{
          display: "flex",
          padding: "0 16px",
          height: 40,
          alignItems: "center",
          fontWeight: "bold",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <div style={{ flex: 2 }}>Timestamp</div>
        <div style={{ flex: 1 }}>User</div>
        <div style={{ flex: 2 }}>Action</div>
        <div style={{ flex: 1 }}>Level</div>
      </div>
      <List
        height={height - 40} // subtract header height
        width={width}
        itemCount={logs.length}
        itemSize={itemHeight}
      >
        {Row}
      </List>
    </div>
  );
};

/**
 * CSS styles for virtualized lists
 */
export const virtualizedListStyles = `
.virtualized-list-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.virtualized-header {
  background-color: #f3f4f6;
}

.virtualized-user-row,
.virtualized-log-row {
  background-color: white;
}

.virtualized-user-row:hover,
.virtualized-log-row:hover {
  background-color: #f9fafb;
}

/* Ensure odd rows have alternating colors */
.virtualized-user-row:nth-child(odd),
.virtualized-log-row:nth-child(odd) {
  background-color: #f9fafb;
}
`;