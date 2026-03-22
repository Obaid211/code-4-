// Dashboard Page Component
const { useState, useEffect } = React;

function DashboardPage({ userData, speechEnabled, chatLang }) {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState('Your Location');
  const [locationInput, setLocationInput] = useState('');
  const [loadingWeather, setLoadingWeather] = useState(false);

  const firstName = userData?.name ? userData.name.split(' ')[0] : 'User';

  function getDayNames() {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day.toLocaleDateString('en-US', { weekday: 'long' }));
    }
    return days;
  }

  async function fetchWeather(lat, lon, city = 'Your Location') {
    setLoadingWeather(true);
    try {
      const data = await SmartAgriAPI.getWeather(lat, lon);
      setWeatherData(data.daily);
      setLocationName(city);
    } catch (e) {
      alert('Failed to fetch weather data');
    }
    setLoadingWeather(false);
  }

  async function handleCitySearch() {
    if (!locationInput.trim()) { alert('Please enter a city name'); return; }
    setLoadingWeather(true);
    try {
      const geo = await SmartAgriAPI.geocodeCity(locationInput.trim());
      if (!geo.results || geo.results.length === 0) { alert('City not found'); setLoadingWeather(false); return; }
      const { latitude, longitude, name } = geo.results[0];
      await fetchWeather(latitude, longitude, name);
    } catch (e) {
      alert('Failed to fetch weather data');
      setLoadingWeather(false);
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await SmartAgriAPI.reverseGeocode(latitude, longitude);
          const city = geo.address?.city || geo.address?.town || 'Current Location';
          await fetchWeather(latitude, longitude, city);
        } catch {
          await fetchWeather(latitude, longitude, 'Current Location');
        }
      },
      () => { alert('Location access denied'); setLoadingWeather(false); }
    );
  }

  const days = getDayNames();

  return (
    <main className="main-content">
      <div className="container">
        <header className="page-header">
          <div className="welcome-message" id="welcomeMessage">
            Welcome back, {firstName}! 👋
          </div>
          <h1>SmartAgri AI Dashboard</h1>
          <p>Your intelligent agricultural companion</p>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Crop Health</h3>
            <p className="stat-value">94%</p>
            <p className="stat-label">Optimal</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <h3>Soil Moisture</h3>
            <p className="stat-value">68%</p>
            <p className="stat-label">Adequate</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌡️</div>
            <h3>Temperature</h3>
            <p className="stat-value">24°C</p>
            <p className="stat-label">Ideal</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌾</div>
            <h3>Yield Forecast</h3>
            <p className="stat-value">+12%</p>
            <p className="stat-label">Expected</p>
          </div>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <a href="#/chat" className="action-card">
              <div className="action-icon">💬</div>
              <h3>AI Chat</h3>
              <p>Get farming advice</p>
            </a>
            <a href="#/analyzer" className="action-card">
              <div className="action-icon">🔍</div>
              <h3>Crop Analyzer</h3>
              <p>Analyze crop health</p>
            </a>
            <a href="#/recommender" className="action-card">
              <div className="action-icon">🌱</div>
              <h3>Crop Recommender</h3>
              <p>Get crop suggestions</p>
            </a>
            <a href="#/market" className="action-card">
              <div className="action-icon">📈</div>
              <h3>Market Prices</h3>
              <p>Check market rates</p>
            </a>
          </div>
        </section>

        <section className="weather-section">
          <h2>Weather &amp; Location</h2>
          <div className="weather-header">
            <h3 id="locationDisplay" style={{ color: 'var(--accent)', margin: 0 }}>
              📍 {locationName}
            </h3>
            <div className="weather-controls">
              <button className="locate-btn" onClick={handleLocate} disabled={loadingWeather}>
                {loadingWeather ? '📍 Locating...' : '📍 My Location'}
              </button>
              <input
                type="text"
                className="location-input"
                placeholder="Enter city name..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
              />
              <button className="fetch-weather-btn" onClick={handleCitySearch} disabled={loadingWeather}>
                {loadingWeather ? 'Loading...' : 'Get Weather'}
              </button>
            </div>
          </div>
          <div className="weather-list">
            {weatherData ? days.map((day, i) => {
              const code = weatherData.weather_code[i];
              const w = WEATHER_CODES[code] || { icon: '🌤️', text: 'Unknown' };
              return (
                <div className="weather-card" key={i}>
                  <h4>{day}</h4>
                  <p className="weather-icon">{w.icon}</p>
                  <p className="temp">{Math.round(weatherData.temperature_2m_max[i])}°C / {Math.round(weatherData.temperature_2m_min[i])}°C</p>
                  <p className="condition">{w.text}</p>
                </div>
              );
            }) : (
              <p style={{ color: 'var(--muted)', textAlign: 'center', width: '100%' }}>
                Enter a city or click "My Location" to load weather data
              </p>
            )}
          </div>
        </section>

        <section className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">2 hours ago</span>
              <span className="activity-text">Soil moisture reached optimal level</span>
              <span className="activity-status success">✓</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">5 hours ago</span>
              <span className="activity-text">Pest detection alert issued</span>
              <span className="activity-status warning">!</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">1 day ago</span>
              <span className="activity-text">Fertilizer application recommended</span>
              <span className="activity-status info">i</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

window.DashboardPage = DashboardPage;
