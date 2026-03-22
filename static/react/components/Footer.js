// Footer Component
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>SmartAgri AI</h4>
          <p>Empowering farmers with AI-driven insights</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#/">Dashboard</a></li>
            <li><a href="#/about">About</a></li>
            <li><a href="#/contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <ul>
            <li><a href="#">Twitter</a></li>
            <li><a href="#">LinkedIn</a></li>
            <li><a href="#">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 SmartAgri AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

window.Footer = Footer;
