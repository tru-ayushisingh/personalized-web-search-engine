// frontend/src/App.js
import { useState, useEffect, useCallback } from 'react';
import SearchBar      from './components/SearchBar';
import ResultCard     from './components/ResultCard';
import LocationBadge  from './components/LocationBadge';
import ProfilePanel   from './components/ProfilePanel';
import { searchQuery, recordClick, getProfile, resetProfile } from './api/searchApi';

function App() {
  // ── STATE ──────────────────────────────────────────────────────────────────
  const [query,     setQuery]     = useState('');        // current search query
  const [results,   setResults]   = useState([]);        // search results from Flask
  const [location,  setLocation]  = useState(null);      // detected city info
  const [interests, setInterests] = useState([]);        // user's interest profile
  const [isLoading, setIsLoading] = useState(false);     // loading spinner flag
  const [error,     setError]     = useState('');        // error message
  const [hasSearched, setHasSearched] = useState(false); // did user search yet?

  // ── LOAD PROFILE ON STARTUP ────────────────────────────────────────────────
  // When app first loads, fetch the user's existing interest profile
  useEffect(() => {
    fetchProfile();
  }, []);

  // ── GET USER LOCATION ──────────────────────────────────────────────────────
  // Asks browser for GPS coordinates using HTML5 Geolocation API
  const getUserLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Browser doesn't support geolocation
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success — got coordinates
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // User denied location or error occurred — continue without location
          resolve({ lat: null, lng: null });
        }
      );
    });
  };

  // ── FETCH PROFILE ──────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setInterests(data.interests || []);
    } catch {
      // Silently fail — profile panel just stays empty
    }
  };

  // ── HANDLE SEARCH ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (inputQuery) => {
    setIsLoading(true);
    setError('');
    setQuery(inputQuery);
    setHasSearched(true);

    // Get user's location coordinates
    const { lat, lng } = await getUserLocation();

    try {
      const data = await searchQuery(inputQuery, lat, lng);
      setResults(data.results  || []);
      setLocation(data.location || null);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── HANDLE RESULT CLICK ────────────────────────────────────────────────────
  const handleResultClick = async (result) => {
    try {
      // Tell Flask which result was clicked → updates user profile
      await recordClick(query, result.link, result.title, result.snippet);
      // Refresh interests panel to show updated profile
      await fetchProfile();
    } catch {
      // Silently fail — click tracking is non-critical
    }
  };

  // ── HANDLE RESET ───────────────────────────────────────────────────────────
  const handleReset = async () => {
    try {
      await resetProfile();
      setInterests([]);
    } catch {
      setError('Could not reset profile. Try again.');
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── HEADER ── */}
      <header style={styles.header}>
        <h1 style={styles.logo}>🔎 PersonalSearch</h1>
        <p style={styles.tagline}>Search results tailored just for you</p>
      </header>

      {/* ── SEARCH BAR ── */}
      <div style={styles.searchSection}>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={styles.content}>

        {/* ── LEFT: RESULTS ── */}
        <div style={styles.resultsSection}>

          {/* Location badge */}
          {location && (
            <LocationBadge
              location={location}
              onClear={() => setLocation(null)}
            />
          )}

          {/* Error message */}
          {error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <span>Searching and personalizing results...</span>
            </div>
          )}

          {/* No results message */}
          {!isLoading && hasSearched && results.length === 0 && !error && (
            <div style={styles.noResults}>
              No results found for "{query}". Try a different search!
            </div>
          )}

          {/* Results list */}
          {!isLoading && results.map((result, index) => (
            <ResultCard
              key={index}
              result={result}
              query={query}
              onResultClick={handleResultClick}
            />
          ))}

          {/* Welcome message before first search */}
          {!hasSearched && !isLoading && (
            <div style={styles.welcome}>
              <p>👋 Welcome! Type something above to search.</p>
              <p style={styles.welcomeSub}>
                Your results will personalize as you click on them!
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: PROFILE PANEL ── */}
        <div style={styles.sidebar}>
          <ProfilePanel
            interests={interests}
            onReset={handleReset}
          />
        </div>

      </div>
    </div>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight:       '100vh',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1a73e8',
    color:           '#ffffff',
    padding:         '24px',
    textAlign:       'center',
  },
  logo: {
    fontSize:   '28px',
    fontWeight: '700',
    margin:     0,
  },
  tagline: {
    fontSize:   '14px',
    opacity:    0.85,
    marginTop:  '4px',
  },
  searchSection: {
    backgroundColor: '#1a73e8',
    padding:         '0 24px 24px',
  },
  content: {
    maxWidth:     '1100px',
    margin:       '24px auto',
    padding:      '0 24px',
    display:      'flex',
    gap:          '24px',
    alignItems:   'flex-start',
  },
  resultsSection: {
    flex: 1,
  },
  sidebar: {
    width:    '280px',
    flexShrink: 0,
  },
  error: {
    backgroundColor: '#fce8e6',
    color:           '#c5221f',
    padding:         '12px 16px',
    borderRadius:    '8px',
    marginBottom:    '12px',
    fontSize:        '14px',
  },
  loading: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    color:      '#5f6368',
    padding:    '20px 0',
  },
  spinner: {
    width:           '20px',
    height:          '20px',
    border:          '2px solid #dadce0',
    borderTopColor:  '#1a73e8',
    borderRadius:    '50%',
    animation:       'spin 0.8s linear infinite',
  },
  noResults: {
    color:     '#5f6368',
    textAlign: 'center',
    padding:   '40px 0',
    fontSize:  '15px',
  },
  welcome: {
    textAlign:  'center',
    padding:    '60px 20px',
    color:      '#5f6368',
    fontSize:   '16px',
    lineHeight: '1.8',
  },
  welcomeSub: {
    fontSize: '13px',
    color:    '#9aa0a6',
  }
};

export default App;