// frontend/src/components/ResultCard.jsx

// Shows one search result
// Props:
//   result: { title, link, snippet, display_link, score, location_match }
//   query:  the search query (for click tracking)
//   onResultClick: function to call when user clicks this result

function ResultCard({ result, query, onResultClick }) {
  const handleClick = () => {
    // Tell the parent (App.js) that this result was clicked
    // App.js will then tell Flask to update the user profile
    onResultClick(result);

    // Open the actual link in a new tab
    window.open(result.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={styles.card}>
      {/* Website URL shown in green (like Google) */}
      <div style={styles.displayLink}>
        {result.display_link}
        {/* Show location pin if this result matched user's city */}
        {result.location_match && (
          <span style={styles.locationTag}>📍 Local</span>
        )}
      </div>

      {/* Clickable title in blue */}
      <div style={styles.title} onClick={handleClick}>
        {result.title}
      </div>

      {/* Description snippet in grey */}
      <div style={styles.snippet}>
        {result.snippet}
      </div>

      {/* Relevance score shown faintly at bottom */}
      <div style={styles.score}>
        Relevance: {(result.score * 100).toFixed(1)}%
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    '8px',
    padding:         '16px 20px',
    marginBottom:    '12px',
    boxShadow:       '0 1px 3px rgba(0,0,0,0.1)',
    cursor:          'pointer',
    transition:      'box-shadow 0.2s',
  },
  displayLink: {
    color:      '#006621',
    fontSize:   '13px',
    marginBottom: '4px',
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  locationTag: {
    backgroundColor: '#e8f5e9',
    color:           '#2e7d32',
    fontSize:        '11px',
    padding:         '2px 8px',
    borderRadius:    '10px',
  },
  title: {
    color:        '#1a0dab',
    fontSize:     '18px',
    fontWeight:   '500',
    marginBottom: '4px',
    cursor:       'pointer',
  },
  snippet: {
    color:      '#4d5156',
    fontSize:   '14px',
    lineHeight: '1.5',
  },
  score: {
    color:     '#9aa0a6',
    fontSize:  '11px',
    marginTop: '8px',
  }
};

export default ResultCard;