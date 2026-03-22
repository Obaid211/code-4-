// About Page Component
function AboutPage() {
  return (
    <main className="main-content">
      <div className="container">
        <header className="page-header">
          <h1>About SmartAgri AI</h1>
          <p>Empowering farmers with intelligent technology</p>
        </header>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <section className="glass-card" style={{
            background: 'var(--glass, rgba(255,255,255,0.05))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
            borderRadius: '14px',
            padding: '2.5rem',
            backdropFilter: 'blur(15px)',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: 'var(--accent, #2d9f60)', marginTop: 0 }}>Our Mission</h2>
            <p style={{ color: 'var(--muted, #b0b0b0)', lineHeight: 1.8, fontSize: '1.05rem' }}>
              SmartAgri AI is dedicated to transforming agriculture through artificial intelligence and data-driven insights. 
              We combine cutting-edge machine learning with practical farming knowledge to help farmers make better decisions,
              reduce crop losses, and maximize their yields.
            </p>
          </section>

          <section className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-icon">🌱</div>
              <h3>AI-Powered</h3>
              <p className="stat-label">Crop recommendations using ML models trained on agricultural data</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔬</div>
              <h3>Disease Detection</h3>
              <p className="stat-label">Upload crop images for instant health analysis</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <h3>AI Chat Assistant</h3>
              <p className="stat-label">Get instant farming advice in multiple languages</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <h3>Smart Insights</h3>
              <p className="stat-label">Weather forecasts, market prices, and irrigation advice</p>
            </div>
          </section>

          <section className="glass-card" style={{
            background: 'var(--glass, rgba(255,255,255,0.05))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
            borderRadius: '14px',
            padding: '2.5rem',
            backdropFilter: 'blur(15px)',
          }}>
            <h2 style={{ color: 'var(--accent, #2d9f60)', marginTop: 0 }}>Key Features</h2>
            <ul style={{ color: 'var(--muted, #b0b0b0)', lineHeight: 2, fontSize: '1.05rem', paddingLeft: '1.5rem' }}>
              <li><strong>Crop Recommendation</strong> — AI-based suggestions using soil and environmental data</li>
              <li><strong>Plant Health Analysis</strong> — Upload crop images for disease detection via Kindwise API</li>
              <li><strong>AI Chat Assistant</strong> — Powered by Groq LLaMA for instant farming guidance</li>
              <li><strong>Voice Support</strong> — Speech-to-text input and text-to-speech responses</li>
              <li><strong>Weather Forecasting</strong> — 7-day forecasts for your farm location</li>
              <li><strong>Market Prices</strong> — Real-time commodity pricing data</li>
              <li><strong>Irrigation Advisor</strong> — Smart watering recommendations based on conditions</li>
              <li><strong>Multi-language Support</strong> — English, Hindi, and Bengali</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

window.AboutPage = AboutPage;
