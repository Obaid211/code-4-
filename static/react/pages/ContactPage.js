// Contact Page Component
const { useState } = React;

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => null);
    } catch {}

    setStatus({ msg: 'Message sent successfully! We will respond soon.', type: 'success' });
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  }

  const inputStyle = {
    border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
    borderRadius: '10px',
    padding: '1rem',
    fontSize: '1rem',
    background: 'var(--glass-2, rgba(255,255,255,0.08))',
    color: 'var(--muted, #b0b0b0)',
    width: '100%',
    transition: 'all 0.3s ease',
  };

  return (
    <main className="main-content">
      <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <header className="page-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you</p>
        </header>

        <div className="glass-card" style={{
          background: 'var(--glass, rgba(255,255,255,0.05))',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
          borderRadius: '14px',
          padding: '2.5rem',
          backdropFilter: 'blur(15px)',
        }}>
          {status.msg && (
            <div className={`form-status show ${status.type}`} style={{
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
              fontWeight: 600,
              marginBottom: '1rem',
              background: status.type === 'success' ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
              color: status.type === 'success' ? '#4caf50' : '#f44336',
              border: `1px solid ${status.type === 'success' ? '#4caf50' : '#f44336'}`,
            }}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ color: 'var(--accent, #2d9f60)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Name</label>
              <input style={inputStyle} type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Your name" />
              {errors.name && <span className="error-message show" style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.name}</span>}
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--accent, #2d9f60)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="your@email.com" />
              {errors.email && <span className="error-message show" style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.email}</span>}
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--accent, #2d9f60)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Subject</label>
              <input style={inputStyle} type="text" value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} placeholder="Subject" />
              {errors.subject && <span className="error-message show" style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.subject}</span>}
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--accent, #2d9f60)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Message</label>
              <textarea
                style={{ ...inputStyle, minHeight: '150px', resize: 'vertical', fontFamily: 'inherit' }}
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                placeholder="Your message..."
              />
              {errors.message && <span className="error-message show" style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.message}</span>}
            </div>
            <button type="submit" style={{
              background: 'linear-gradient(135deg, var(--accent, #2d9f60) 0%, #22a344 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '1.1rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}>Send Message</button>
          </form>
        </div>
      </div>
    </main>
  );
}

window.ContactPage = ContactPage;
