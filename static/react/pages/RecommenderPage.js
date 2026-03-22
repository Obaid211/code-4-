// Recommender Page Component
const { useState } = React;

function RecommenderPage() {
  const [formData, setFormData] = useState({ N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    const payload = {
      N: parseFloat(formData.N),
      P: parseFloat(formData.P),
      K: parseFloat(formData.K),
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      ph: parseFloat(formData.ph),
      rainfall: parseFloat(formData.rainfall),
    };

    try {
      const data = await SmartAgriAPI.recommendCrop(payload);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Recommendation failed');
    }
    setLoading(false);
  }

  const fields = [
    { name: 'N', label: 'Nitrogen (N)', placeholder: 'e.g., 90' },
    { name: 'P', label: 'Phosphorus (P)', placeholder: 'e.g., 42' },
    { name: 'K', label: 'Potassium (K)', placeholder: 'e.g., 43' },
    { name: 'temperature', label: 'Temperature (°C)', placeholder: 'e.g., 20.8', step: '0.1' },
    { name: 'humidity', label: 'Humidity (%)', placeholder: 'e.g., 82.0', step: '0.1' },
    { name: 'ph', label: 'Soil pH', placeholder: 'e.g., 6.5', step: '0.1' },
    { name: 'rainfall', label: 'Rainfall (mm)', placeholder: 'e.g., 202.9', step: '0.1' },
  ];

  return (
    <React.Fragment>
      <div className="recommender-container">
        <section className="recommender-section glass-card">
          <h2>🌱 Crop Recommender</h2>
          <p>Enter your soil and weather data to get a crop and irrigation recommendation.</p>

          <form onSubmit={handleSubmit} className="recommender-form">
            <div className="form-grid">
              {fields.map((f) => (
                <div className="form-group" key={f.name}>
                  <label htmlFor={`rec${f.name}`}>{f.label}</label>
                  <input
                    type="number"
                    step={f.step || undefined}
                    id={`rec${f.name}`}
                    name={f.name}
                    placeholder={f.placeholder}
                    value={formData[f.name]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="action-button" disabled={loading}>
              {loading ? 'Analyzing...' : 'Get Recommendation'}
            </button>
          </form>
        </section>

        <div className="results-area" id="resultsArea">
          {loading && (
            <div className="glass-card">
              <p style={{ textAlign: 'center' }}>Loading recommendations...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results && results.irrigation && (
            <section className="results-card glass-card irrigation-card" style={{ opacity: 1 }}>
              <h3>💧 Irrigation Advisor</h3>
              <p className="irrigation-action">{results.irrigation.action}</p>
              <p className="irrigation-priority">
                Watering Priority: <span>{results.irrigation.priority} / 1.0</span>
              </p>
              <p className="irrigation-explanation">
                <strong>Reason:</strong> {results.irrigation.explanation}
              </p>
            </section>
          )}

          {results && results.recommendations && results.recommendations.length > 0 && (
            <section className="results-card glass-card" style={{ opacity: 1 }}>
              <h3>🌾 Top Crop Recommendations</h3>
              <ul className="crop-list">
                {results.recommendations.map((crop, idx) => (
                  <li className={`crop-item ${idx === 0 ? 'top-pick' : ''}`} key={idx}>
                    {idx === 0 && <div className="top-pick-badge">⭐ Top Pick</div>}
                    <div className="crop-details">
                      <h4 className="crop-name">{crop.crop}</h4>
                      <p className="crop-confidence">
                        <strong>{crop.confidence}%</strong> confidence
                      </p>
                    </div>
                    <div className="crop-fertilizer">
                      <strong>Fertilizer:</strong><br />
                      <span dangerouslySetInnerHTML={{ __html: crop.fertilizer.replace(/\n/g, '<br>') }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

window.RecommenderPage = RecommenderPage;
