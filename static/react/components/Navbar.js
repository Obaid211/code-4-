// Navbar Component
const { useState, useEffect, useRef } = React;

function Navbar({ currentHash, user, userData, chatLang, setChatLang }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinks = [
    { hash: '#/', label: 'Dashboard' },
    { hash: '#/chat', label: 'Chat' },
    { hash: '#/analyzer', label: 'Analyzer' },
    { hash: '#/recommender', label: 'Recommender' },
    { hash: '#/market', label: 'Market' },
    { hash: '#/profile', label: 'Profile' },
    { hash: '#/about', label: 'About' },
    { hash: '#/contact', label: 'Contact' },
  ];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const firstName = userData?.name ? userData.name.split(' ')[0] : 'User';

  async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await FirebaseService.signOut();
        window.location.hash = '#/login';
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">🌾</span>
          <span>SmartAgri AI</span>
        </div>

        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.hash}>
              <a
                href={link.hash}
                className={`nav-link ${currentHash === link.hash ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="toolbar">
          <div className="language-selector">
            <select
              id="chatLang"
              className="language-dropdown"
              value={chatLang}
              onChange={(e) => {
                setChatLang(e.target.value);
                localStorage.setItem('chatLanguage', e.target.value);
              }}
              aria-label="Chat language"
            >
              <option value="en">🌍 English</option>
              <option value="hi">🌍 हिन्दी</option>
              <option value="bn">🌍 বাংলা</option>
            </select>
          </div>

          {user && (
            <div className="user-menu" ref={dropdownRef}>
              <button className="user-button" onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
                <span className="user-avatar">👤</span>
                <span id="userNameDisplay">{firstName}</span>
              </button>
              <div className={`user-dropdown ${dropdownOpen ? 'show' : ''}`}>
                <div className="dropdown-header">
                  <div className="user-name">{userData?.name || 'User Name'}</div>
                  <div className="user-email">{userData?.email || ''}</div>
                </div>
                <a href="#/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span className="dropdown-icon">⚙️</span>
                  <span>Settings</span>
                </a>
                <a href="#/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span className="dropdown-icon">👤</span>
                  <span>Profile</span>
                </a>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

window.Navbar = Navbar;
