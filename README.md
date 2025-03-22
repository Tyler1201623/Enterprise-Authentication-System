# React TypeScript Enterprise Authentication System

A fully functional, secure, HIPAA-compliant client-side user authentication system built with React and TypeScript. This enterprise-grade solution is designed to handle thousands of users while providing strong encryption and full HIPAA compliance.

## Enterprise Security Features

- 🔒 **HIPAA Compliance** - Advanced AES-256 encryption with CBC mode
- 👤 **Role-Based Access Control** - Strict admin vs regular user permissions
- 📊 **Enterprise-Ready Admin Dashboard** - View and manage thousands of users
- 📝 **Comprehensive Audit Logging** - Complete audit trail with pagination
- 🛡️ **Enhanced Security** - PBKDF2 password hashing with 10,000 iterations
- 🔐 **Secure Local Storage** - All data encrypted with industry-standard protocols
- 📈 **Optimized for Scale** - Indexed data structures for fast lookups with large datasets

## Legal Compliance

This system is engineered to meet HIPAA (Health Insurance Portability and Accountability Act) requirements:

- **Data Encryption**: All Protected Health Information (PHI) is secured using AES-256 CBC encryption
- **Access Controls**: Role-based permissions strictly enforced at all levels
- **Audit Controls**: Comprehensive, tamper-evident audit logging with cryptographic integrity
- **Data Integrity**: All database operations maintain data consistency with transaction-like rollback
- **Authentication**: Secure password handling with industry-standard PBKDF2 hashing
- **Authorization**: Granular permissions and explicit admin approval flow
- **Emergency Access**: Admin override capabilities for emergency situations

## Project Structure

```
src/
├── components/
│   ├── AdminDashboard.tsx  - Main admin dashboard with tabs
│   ├── AdminSetup.tsx      - Tool to grant admin privileges
│   ├── AuditLog.tsx        - View system logs with pagination
│   ├── DatabaseManager.tsx - Export/import database
│   ├── Footer.tsx          - HIPAA compliance footer
│   ├── LoginForm.tsx       - Login form component
│   ├── SignupForm.tsx      - Signup form component
│   ├── UserList.tsx        - User management component
│   └── UserProfile.tsx     - User profile with admin access
├── contexts/
│   └── AuthContext.tsx     - Authentication context provider
├── hooks/
│   └── useAuth.ts          - Core authentication logic with admin features
└── utils/
    └── database.ts         - High-performance database and encryption utilities
```

## Performance Optimizations

This system includes specialized optimizations for handling thousands of users:

1. **Indexed Data Structures**: Email → User ID mappings for O(1) lookups
2. **Memory Caching**: User session caching to minimize storage reads
3. **Efficient Pagination**: Log and user data pagination to handle large datasets
4. **Optimized DOM Rendering**: Virtualized scrolling for large data tables
5. **Smart Data Loading**: Only load what's needed when it's needed

## How Enterprise Authentication Works

1. **Encrypted Storage**: User data encrypted using AES-256 with CBC mode before storage
2. **Password Security**: Passwords hashed using PBKDF2 with 10,000 iterations and unique 32-byte salt per user
3. **Role-Based Access**: Admin privileges strictly controlled and verified on every operation
4. **Audit Logging**: All system events logged with timestamps, user info, and detailed actions
5. **Admin Dashboard**: Secure administrative interface with pagination for large datasets

## Administrator Access

The admin dashboard allows authorized administrators to:

1. View registered users with efficient pagination for thousands of records
2. Monitor system activity through comprehensive audit logs
3. Export and import database data with strict security validation
4. Access real-time performance metrics and system health data

## Quick Setup for Your Project

### Option 1: Copy Necessary Files

1. Copy these core files to your project:

   ```
   src/utils/database.ts
   src/contexts/AuthContext.tsx
   src/hooks/useAuth.ts
   ```

2. Copy only the components you need:

   ```
   src/components/LoginForm.tsx
   src/components/SignupForm.tsx
   src/components/UserProfile.tsx
   ```

   For admin features, also include:

   ```
   src/components/AdminDashboard.tsx
   src/components/AdminSetup.tsx
   src/components/UserList.tsx
   src/components/AuditLog.tsx
   src/components/DatabaseManager.tsx
   ```

3. Install required dependencies:

   ```
   npm install crypto-js nanoid
   npm install @types/crypto-js --save-dev
   ```

### Option 2: NPM Package (Coming Soon)

This authentication system will be available as an NPM package for even easier integration:

```
npm install react-enterprise-auth
```

## Integration Instructions

1. Wrap your app with the `AuthProvider`:

   ```tsx
   import { AuthProvider } from "./contexts/AuthContext";

   ReactDOM.createRoot(document.getElementById("root")!).render(
     <React.StrictMode>
       <AuthProvider>
         <App />
       </AuthProvider>
     </React.StrictMode>
   );
   ```

2. Use the authentication context in your components:

   ```tsx
   import { useAuthContext } from "./contexts/AuthContext";

   function MyComponent() {
     const { isAuthenticated, user, isAdmin, login, logout } = useAuthContext();

     // Your component logic here
   }
   ```

3. Add auth forms to your app:

   ```tsx
   import LoginForm from "./components/LoginForm";
   import SignupForm from "./components/SignupForm";
   import UserProfile from "./components/UserProfile";

   function App() {
     const [isLogin, setIsLogin] = useState(true);
     const { isAuthenticated } = useAuthContext();

     return (
       <div>
         {!isAuthenticated && (
           <>
             {isLogin ? (
               <LoginForm onSwitch={() => setIsLogin(false)} />
             ) : (
               <SignupForm onSwitch={() => setIsLogin(true)} />
             )}
           </>
         )}

         {isAuthenticated && <UserProfile />}
       </div>
     );
   }
   ```

## Security Customization Options

### Change Encryption Key

For security, always use your own encryption key in production:

```typescript
// in src/utils/database.ts
const ENCRYPTION_KEY = "your-custom-encryption-key";
```

### Set Admin Email

Define which email will have admin privileges:

```typescript
// in src/utils/database.ts
const ADMIN_EMAIL = "your-admin-email@example.com";
```

### Custom Storage Keys

Change the keys used for localStorage:

```typescript
// in src/utils/database.ts
const DB_STORAGE_KEY = "your_app_name_db";
const LOGS_STORAGE_KEY = "your_app_name_logs";
```

## Legal Notice

While this system implements industry-standard security practices for HIPAA compliance, organizations must perform their own compliance assessments based on their specific use cases and risk profiles. The author provides this software as-is without warranty of fitness for a particular purpose.

## Author

Created by Tyler Keesee

## License

MIT

## Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages when you push to the main branch. The deployment is handled by a GitHub Actions workflow that:

1. Builds the React app
2. Configures it for SPA routing on GitHub Pages
3. Deploys it to the gh-pages branch

To view your deployed app, go to: `https://[your-username].github.io/[repo-name]`

### Manual Deployment

You can also deploy manually:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Build for Production

```bash
# Build the project
npm run build

# Serve the production build locally
npx serve -s build
```

## Technologies Used

- React 18
- TypeScript
- React Router for routing
- Styled Components
- jsPDF for PDF generation
- LocalStorage for data persistence

## Security Features

- AES-256 encryption for local data
- Secure password hashing
- MFA support
- Session timeout
- Detailed audit logging
- HIPAA-compliant data handling

## Browser Support

This application is optimized for modern browsers including:

- Chrome
- Firefox
- Safari
- Edge
