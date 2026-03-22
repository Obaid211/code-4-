// App Component — Main Router & Auth Shell
const { useState, useEffect } = React;

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/login');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [chatLang, setChatLang] = useState(localStorage.getItem('chatLanguage') || 'en');

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      setCurrentHash(window.location.hash || '#/');
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const profile = await FirebaseService.loadUserProfile(firebaseUser);
          setUserData(profile);
        } catch (err) {
          console.error('Error loading profile:', err);
        }

        // Redirect to dashboard if on login/signup
        const hash = window.location.hash;
        if (hash === '#/login' || hash === '#/signup' || hash === '' || hash === '#') {
          window.location.hash = '#/';
          setCurrentHash('#/');
        }
      } else {
        setUserData(null);
        // Redirect to login if on protected page
        const publicHashes = ['#/login', '#/signup', '#/about', '#/contact'];
        const hash = window.location.hash || '#/login';
        if (!publicHashes.includes(hash)) {
          window.location.hash = '#/login';
          setCurrentHash('#/login');
        }
      }

      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Don't render until auth is ready
  if (!authReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#f0f0f0',
        fontSize: '1.2rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s ease-in-out infinite' }}>🌾</div>
          <p>Loading SmartAgri AI...</p>
        </div>
      </div>
    );
  }

  // Determine which page to show
  const isAuthPage = currentHash === '#/login' || currentHash === '#/signup';
  const showNavbar = !isAuthPage && user;

  function renderPage() {
    switch (currentHash) {
      case '#/':
        return <DashboardPage userData={userData} chatLang={chatLang} />;
      case '#/chat':
        return <ChatPage chatLang={chatLang} />;
      case '#/analyzer':
        return <AnalyzerPage />;
      case '#/recommender':
        return <RecommenderPage />;
      case '#/market':
        return <MarketPage />;
      case '#/about':
        return <AboutPage />;
      case '#/contact':
        return <ContactPage />;
      case '#/profile':
        return <ProfilePage user={user} userData={userData} setUserData={setUserData} />;
      case '#/login':
        return <LoginPage />;
      case '#/signup':
        return <SignupPage />;
      default:
        return <DashboardPage userData={userData} chatLang={chatLang} />;
    }
  }

  return (
    <React.Fragment>
      {showNavbar && (
        <Navbar
          currentHash={currentHash}
          user={user}
          userData={userData}
          chatLang={chatLang}
          setChatLang={setChatLang}
        />
      )}
      {renderPage()}
      {showNavbar && <Footer />}
    </React.Fragment>
  );
}

window.App = App;
