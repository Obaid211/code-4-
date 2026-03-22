// Market Page Component
const { useState } = React;

function MarketPage() {
  const [weatherData, setWeatherData] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(false);

  const marketData = [
    { name: 'Wheat', price: '₹2,450', trend: '+2.3%', up: true },
    { name: 'Rice', price: '₹3,200', trend: '+1.8%', up: true },
    { name: 'Cotton', price: '₹5,800', trend: '-0.5%', up: false },
    { name: 'Maize', price: '₹1,950', trend: '+3.1%', up: true },
  ];

  function getDayNames() {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d.toLocaleDateString('en-US', { weekday: 'long' }));
    }
    return days;
  }

  async function fetchWeather(lat, lon) {
    setLoading(true);
    try {
      const data = await SmartAgriAPI.getWeather(lat, lon);
      setWeatherData(data.daily);
    } catch {
      alert('Failed to fetch weather data');
    }
    setLoading(false);
  }

  async function handleCitySearch() {
    if (!locationInput.trim()) { alert('Please enter a city name'); return; }
    setLoading(true);
    try {
      const geo = await SmartAgriAPI.geocodeCity(locationInput.trim());
      if (!geo.results || !geo.results.length) { alert('City not found'); setLoading(false); return; }
      await fetchWeather(geo.results[0].latitude, geo.results[0].longitude);
    } catch {
      alert('Failed to fetch weather data');
      setLoading(false);
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { alert('Location access denied'); setLoading(false); }
    );
  }

  const days = getDayNames();

  return (
    <main className="main-content">
      <div className="container">
        <header className="page-header">
          <h1>Market &amp; Weather</h1>
          <p>Real-time prices and forecasts</p>
        </header>

        <div className="market-grid">
          <section className="market-section">
            <h2>Market Prices</h2>
            <div className="prices-list">
              {marketData.map((item, i) => (
                <div className="price-card" key={i}>
                  <div className="price-header">
                    <h3>{item.name}</h3>
                    <span className={`trend ${item.up ? 'up' : 'down'}`}>
                      {item.up ? '↑' : '↓'} {item.trend}
                    </span>
                  </div>
                  <p className="price">{item.price} per quintal</p>
                  <p className="price-time">Updated 2 hours ago</p>
                </div>
              ))}
            </div>
          </section>

          <section className="weather-section">
            <div className="weather-header">
              <h2>7-Day Forecast</h2>
              <div className="weather-controls">
                <button className="locate-btn" onClick={handleLocate} disabled={loading}>
                  📍 Locate me
                </button>
                <input
                  type="text"
                  className="location-input"
                  placeholder="Enter city name"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                />
                <button className="fetch-weather-btn" onClick={handleCitySearch} disabled={loading}>
                  {loading ? 'Loading...' : 'Get Weather'}
                </button>
              </div>
            </div>
            <div className="weather-list" id="weatherContainer">
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
                <React.Fragment>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d, i) => (
                    <div className="weather-card" key={i}>
                      <h4>{d}</h4>
                      <p className="weather-icon">🌤️</p>
                      <p className="temp">--°C / --°C</p>
                      <p className="condition">No data</p>
                    </div>
                  ))}
                </React.Fragment>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

window.MarketPage = MarketPage;
