// Profile Page Component
const { useState, useEffect } = React;

function ProfilePage({ user, userData, setUserData }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [editingFarm, setEditingFarm] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  // Farm form
  const [farmForm, setFarmForm] = useState({ name: '', location: '', area: '', crops: '' });
  // Settings form
  const [settings, setSettings] = useState({
    emailNotifications: true,
    weatherAlerts: true,
    marketAlerts: false,
    pestAlerts: true,
  });

  useEffect(() => {
    if (userData) {
      setProfileForm({ name: userData.name || '', email: userData.email || '' });
      setFarmForm({
        name: userData.farmInfo?.name || '',
        location: userData.farmInfo?.location || '',
        area: userData.farmInfo?.area || '',
        crops: userData.farmInfo?.crops || '',
      });
      setSettings(userData.settings || settings);
    }
  }, [userData]);

  function showStatus(msg, type) {
    setStatus({ msg, type });
    if (type === 'error') setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  }

  async function saveProfile() {
    try {
      await FirebaseService.updateProfile({ name: profileForm.name, email: profileForm.email });
      setUserData((prev) => ({ ...prev, name: profileForm.name, email: profileForm.email }));
      setEditing(false);
      showStatus('Profile updated successfully!', 'success');
    } catch (e) {
      showStatus('Failed to update profile: ' + e.message, 'error');
    }
  }

  async function saveFarm() {
    const info = { ...farmForm, area: parseFloat(farmForm.area) || 0 };
    try {
      await FirebaseService.updateFarmInfo(info);
      setUserData((prev) => ({ ...prev, farmInfo: info }));
      setEditingFarm(false);
      showStatus('Farm info updated!', 'success');
    } catch (e) {
      showStatus('Failed to update farm info: ' + e.message, 'error');
    }
  }

  async function saveSettings() {
    try {
      await FirebaseService.updateSettings(settings);
      setUserData((prev) => ({ ...prev, settings }));
      showStatus('Settings saved!', 'success');
    } catch (e) {
      showStatus('Failed to save settings: ' + e.message, 'error');
    }
  }

  const cardStyle = {
    background: 'var(--glass, rgba(255,255,255,0.05))',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
    borderRadius: '14px',
    padding: '2rem',
    backdropFilter: 'blur(15px)',
    marginBottom: '1.5rem',
  };

  const inputStyle = {
    border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
    borderRadius: '8px',
    padding: '0.8rem',
    fontSize: '1rem',
    background: 'rgba(0,0,0,0.2)',
    color: '#f0f0f0',
    width: '100%',
    marginTop: '0.3rem',
  };

  const tabStyle = (tab) => ({
    padding: '0.8rem 1.5rem',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent, #2d9f60)' : '2px solid transparent',
    background: 'none',
    color: activeTab === tab ? 'var(--accent, #2d9f60)' : 'var(--muted, #b0b0b0)',
    fontWeight: activeTab === tab ? 700 : 400,
    fontSize: '1rem',
    transition: 'all 0.2s',
  });

  return (
    <main className="main-content">
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header className="page-header">
          <h1>Profile & Settings</h1>
          <p>Manage your account and preferences</p>
        </header>

        {status.msg && (
          <div style={{
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

        <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.15))' }}>
          <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>👤 Profile</button>
          <button style={tabStyle('farm')} onClick={() => setActiveTab('farm')}>🌾 Farm Info</button>
          <button style={tabStyle('settings')} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
        </div>

        {activeTab === 'profile' && (
          <div style={cardStyle}>
            <h3 style={{ color: 'var(--accent, #2d9f60)', marginTop: 0 }}>Personal Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Name</label>
                {editing ? (
                  <input style={inputStyle} value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} />
                ) : (
                  <p style={{ color: 'var(--muted, #b0b0b0)', margin: '0.3rem 0 0' }}>{userData?.name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Email</label>
                <p style={{ color: 'var(--muted, #b0b0b0)', margin: '0.3rem 0 0' }}>{userData?.email || 'Not set'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Member Since</label>
                <p style={{ color: 'var(--muted, #b0b0b0)', margin: '0.3rem 0 0' }}>
                  {userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Subscription</label>
                <p style={{ color: 'var(--accent, #2d9f60)', margin: '0.3rem 0 0', fontWeight: 600, textTransform: 'capitalize' }}>
                  {userData?.subscription || 'Free'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editing ? (
                  <React.Fragment>
                    <button onClick={saveProfile} style={{ background: 'var(--accent, #2d9f60)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#f0f0f0', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer' }}>Cancel</button>
                  </React.Fragment>
                ) : (
                  <button onClick={() => setEditing(true)} style={{ background: 'var(--accent, #2d9f60)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>Edit Profile</button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'farm' && (
          <div style={cardStyle}>
            <h3 style={{ color: 'var(--accent, #2d9f60)', marginTop: 0 }}>Farm Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editingFarm ? (
                <React.Fragment>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Farm Name</label>
                    <input style={inputStyle} value={farmForm.name} onChange={(e) => setFarmForm({...farmForm, name: e.target.value})} placeholder="My Farm" />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Location</label>
                    <input style={inputStyle} value={farmForm.location} onChange={(e) => setFarmForm({...farmForm, location: e.target.value})} placeholder="City, State" />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Area (acres)</label>
                    <input style={inputStyle} type="number" value={farmForm.area} onChange={(e) => setFarmForm({...farmForm, area: e.target.value})} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Crops</label>
                    <input style={inputStyle} value={farmForm.crops} onChange={(e) => setFarmForm({...farmForm, crops: e.target.value})} placeholder="Wheat, Rice, Cotton" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={saveFarm} style={{ background: 'var(--accent, #2d9f60)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditingFarm(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#f0f0f0', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Farm Name</label>
                    <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>{userData?.farmInfo?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Location</label>
                    <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>{userData?.farmInfo?.location || 'Not set'}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Area</label>
                    <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>{userData?.farmInfo?.area ? userData.farmInfo.area + ' acres' : 'Not set'}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#f0f0f0' }}>Crops</label>
                    <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>{userData?.farmInfo?.crops || 'Not set'}</p>
                  </div>
                  <button onClick={() => setEditingFarm(true)} style={{ background: 'var(--accent, #2d9f60)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>Edit Farm Info</button>
                </React.Fragment>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={cardStyle}>
            <h3 style={{ color: 'var(--accent, #2d9f60)', marginTop: 0 }}>Notification Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'emailNotifications', label: 'Email Notifications' },
                { key: 'weatherAlerts', label: 'Weather Alerts' },
                { key: 'marketAlerts', label: 'Market Alerts' },
                { key: 'pestAlerts', label: 'Pest Alerts' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#f0f0f0' }}>
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent, #2d9f60)' }}
                  />
                  {label}
                </label>
              ))}
              <button onClick={saveSettings} style={{ background: 'var(--accent, #2d9f60)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

window.ProfilePage = ProfilePage;
