// Analyzer Page Component
const { useState, useRef } = React;

function AnalyzerPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (f.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }

    setFile(f);
    setResult(null);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '';
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }

  async function analyze() {
    if (!file) { alert('Please upload an image first'); return; }
    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const data = await SmartAgriAPI.analyzePlant(file);
      console.log('API response:', JSON.stringify(data, null, 2));
      if (data.status === 'no_plant_identified') {
        setError(data.message || 'No plant could be identified.');
      } else if (data.status === 'success') {
        setResult(data);
      } else if (data.status === 'error') {
        setError(data.message || 'Analysis failed');
      }
    } catch (e) {
      setError(e.message || 'Analysis failed');
    }
    setAnalyzing(false);
  }

  function clear() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const healthPct = result ? Math.round((result.health?.health_probability || 0) * 100) : 0;
  const isHealthy = result?.health?.is_healthy;

  return (
    <main className="main-content">
      <div className="analyzer-wrapper">
        <h1>🌿 SmartAgri Crop Analyzer</h1>
        <p>Upload a clear image of your plant or leaf to identify species and detect diseases.</p>


        <div
          className="upload-box"
          id="uploadBox"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="file-input"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          <div className="upload-content">
            <span className="upload-icon">📷</span>
            <h3>Drop or Browse Image</h3>
            <p className="hint">Supported formats: JPG, PNG (max 5MB)</p>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn" onClick={analyze} disabled={analyzing || !file}>
            {analyzing ? 'Analyzing...' : 'Analyze Image'}
          </button>
          <button className="action-btn secondary" onClick={clear}>Clear</button>
        </div>

        {preview && (
          <div className="preview-section" id="previewSection">
            <h3>Image Preview</h3>
            <div className="preview-container">
              <img src={preview} alt="Crop preview" className="preview-img" />
            </div>
            <div className="preview-info">
              <p>📄 {file?.name || 'No file selected'}</p>
              <p>💾 {file ? (file.size / 1024).toFixed(2) + ' KB' : '0 KB'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="results-section" id="resultsSection">
            <h2>🧠 Analysis Results</h2>
            <div className="results-box" style={{ color: '#ffcdd2', textAlign: 'center', padding: '2rem' }}>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="results-section" id="resultsSection">
            <h2>🧠 Analysis Results</h2>

            <div className="health-score">
              <h3>Health Status</h3>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: healthPct + '%',
                    backgroundColor: isHealthy ? '#4caf50' : '#f44336',
                  }}
                ></div>
              </div>
              <p className="score-text">
                {healthPct}% — {isHealthy ? 'Healthy' : 'Issues Detected'}
              </p>
            </div>

            <div className="results-box" id="analyzerResult">
              <h3>🌱 Identified: {result.crop?.name || 'Unknown'}</h3>
              <p>Confidence: {(result.crop?.probability * 100).toFixed(1)}%</p>
              {result.crop?.description && <p>{result.crop.description}</p>}

              {result.health?.diseases?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#f44336' }}>⚠️ Diseases Detected:</h4>
                  {result.health.diseases.map((d, i) => (
                    <div key={i} style={{
                      background: 'rgba(244,67,54,0.1)',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                    }}>
                      <strong>{d.name}</strong> ({(d.probability * 100).toFixed(1)}%)
                      {d.details?.description && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{d.details.description}</p>}
                      {d.details?.treatment && (
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          <strong>Treatment:</strong> {d.details.treatment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="recommendations-box">
              <h3>💡 Care Recommendations</h3>
              <ul className="recommendations-list" id="recommendationsList">
                {isHealthy ? (
                  <>
                    <li>Continue current care routine</li>
                    <li>Monitor for any changes in leaf color</li>
                    <li>Ensure proper watering schedule</li>
                  </>
                ) : (
                  <>
                    <li>Isolate affected plants if possible</li>
                    <li>Apply recommended treatment promptly</li>
                    <li>Monitor neighboring plants for spread</li>
                    <li>Consult local agricultural extension office</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

window.AnalyzerPage = AnalyzerPage;
