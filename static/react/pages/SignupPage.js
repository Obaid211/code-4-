// Signup Page Component
const { useState } = React;

function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setStatus({ msg: '', type: '' });

    try {
      await FirebaseService.signUp(email.trim(), password, name.trim());
      setStatus({ msg: '✓ Account created! Redirecting...', type: 'success' });
      setTimeout(() => { window.location.hash = '#/'; }, 1500);
    } catch (err) {
      const msg = FirebaseService.getFriendlyError(err.code);
      setStatus({ msg: `✗ ${msg}`, type: 'error' });
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-hero">
          <div className="hero-content">
            <div className="hero-icon">🌾</div>
            <h1>Join SmartAgri</h1>
            <p>Create your account and start your journey towards smarter, more sustainable farming practices.</p>
          </div>
        </div>

        <div className="login-form-section">
          <h2>Create Account</h2>
          <p className="subtitle">Sign up to get started</p>

          {status.msg && (
            <div className={`form-status show ${status.type}`}>{status.msg}</div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="signupName">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="signupName"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({...p, name: ''})); }}
                  style={errors.name ? { borderColor: '#ff6b6b' } : {}}
                />
              </div>
              {errors.name && <span className="error-message show">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signupEmail">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="signupEmail"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({...p, email: ''})); }}
                  style={errors.email ? { borderColor: '#ff6b6b' } : {}}
                />
              </div>
              {errors.email && <span className="error-message show">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signupPassword">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signupPassword"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({...p, password: ''})); }}
                  style={errors.password ? { borderColor: '#ff6b6b' } : {}}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="error-message show">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signupConfirm">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signupConfirm"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({...p, confirmPassword: ''})); }}
                  style={errors.confirmPassword ? { borderColor: '#ff6b6b' } : {}}
                />
              </div>
              {errors.confirmPassword && <span className="error-message show">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '🔄 Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <div className="signup-link">
            Already have an account? <a href="#/login">Login here</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SignupPage = SignupPage;
