export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="encryption-indicator">
          HIPAA Compliant <span className="hipaa-badge">Encrypted</span> - All data is encrypted and stored securely in your browser.
        </div>
        <p className="footer-text">
          This authentication system uses enterprise-level security practices including AES-256 encryption and secure password hashing.
        </p>
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} Enterprise Account Authentication - HIPAA-Compliant Security System | Made by Tyler Keesee
        </p>
      </div>
    </footer>
  );
} 