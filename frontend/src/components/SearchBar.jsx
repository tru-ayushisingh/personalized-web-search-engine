// frontend/src/components/SearchBar.jsx
import { useState } from 'react';

// Props:
//   onSearch: function called when user submits a query
//   isLoading: boolean — shows spinner while waiting for results

function SearchBar({ onSearch, isLoading }) {
  // Local state: what the user is currently typing
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    // Don't search if input is empty or only spaces
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  // Allow pressing Enter to search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Search icon */}
        <span style={styles.icon}>🔍</span>

        {/* Text input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search anything..."
          style={styles.input}
          disabled={isLoading}
        />

        {/* Search button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !query.trim()}
          style={styles.button}
        >
          {isLoading ? '...' : 'Search'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width:      '100%',
    maxWidth:   '650px',
    margin:     '0 auto',
  },
  container: {
    display:      'flex',
    alignItems:   'center',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow:    '0 2px 8px rgba(0,0,0,0.15)',
    padding:      '8px 16px',
    gap:          '8px',
  },
  icon: {
    fontSize: '18px',
  },
  input: {
    flex:       1,
    border:     'none',
    outline:    'none',
    fontSize:   '16px',
    color:      '#202124',
    background: 'transparent',
  },
  button: {
    backgroundColor: '#1a73e8',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '20px',
    padding:         '8px 20px',
    fontSize:        '14px',
    cursor:          'pointer',
    fontWeight:      '500',
  }
};

export default SearchBar;