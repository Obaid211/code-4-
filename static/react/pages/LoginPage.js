// Login Page Component
const { useState } = React;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
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
      await FirebaseService.setPersistence(remember);
      await FirebaseService.signIn(email.trim(), password);
      setStatus({ msg: '✓ Login successful! Redirecting to dashboard...', type: 'success' });
      setTimeout(() => { window.location.hash = '#/'; }, 1500);
    } catch (err) {
      const msg = FirebaseService.getFriendlyError(err.code);
      setStatus({ msg: `✗ ${msg}`, type: 'error' });
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!email.trim()) { setStatus({ msg: 'Please enter your email address first', type: 'error' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus({ msg: 'Please enter a valid email address', type: 'error' }); return; }

    try {
      await FirebaseService.sendPasswordReset(email.trim());
      setStatus({ msg: '✓ Password reset email sent! Check your inbox.', type: 'success' });
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email.' : 'Error sending reset email.';
      setStatus({ msg, type: 'error' });
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-hero">
          <div className="hero-content">
            <div className="hero-icon">🌱</div>
            <h1>SmartAgri AI</h1>
            <p>Empowering farmers with AI-driven insights for sustainable agriculture and better crop management.</p>
          </div>
        </div>

        <div className="login-form-section">
          <h2>Welcome Back</h2>
          <p className="subtitle">Login to access your farming dashboard</p>

          {status.msg && (
            <div className={`form-status show ${status.type}`}>{status.msg}</div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="loginEmail">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="loginEmail"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({...p, email: ''})); }}
                  style={errors.email ? { borderColor: '#ff6b6b' } : {}}
                />
              </div>
              {errors.email && <span className="error-message show">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  placeholder="Enter your password"
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

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="rememberMe" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <a href="#" className="forgot-password" onClick={handleForgotPassword}>Forgot Password?</a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '🔄 Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <div className="signup-link">
            Don't have an account? <a href="#/signup">Sign up here</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;
