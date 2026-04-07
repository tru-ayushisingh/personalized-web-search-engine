// frontend/src/components/ProfilePanel.jsx

// Shows the user's current interest profile
// Props:
//   interests: [{ term, weight }, ...]
//   onReset: function to clear the profile

function ProfilePanel({ interests, onReset }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>🧠 Your Interests</span>

        {/* Reset button — clears all interests */}
        {interests.length > 0 && (
          <button onClick={onReset} style={styles.resetBtn}>
            Clear
          </button>
        )}
      </div>

      {/* Show message if no interests yet */}
      {interests.length === 0 ? (
        <p style={styles.empty}>
          Click search results to build your interest profile!
        </p>
      ) : (
        <div style={styles.tagContainer}>
          {interests.map(({ term, weight }) => (
            <div key={term} style={styles.tag}>
              {/* Term name */}
              <span>{term}</span>
              {/* Visual weight bar */}
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${Math.round(weight * 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  panel: {
    backgroundColor: '#ffffff',
    borderRadius:    '8px',
    padding:         '16px',
    boxShadow:       '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom:    '20px',
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '12px',
  },
  title: {
    fontSize:   '15px',
    fontWeight: '600',
    color:      '#202124',
  },
  resetBtn: {
    background:   'none',
    border:       '1px solid #dadce0',
    borderRadius: '4px',
    padding:      '4px 10px',
    cursor:       'pointer',
    fontSize:     '12px',
    color:        '#5f6368',
  },
  empty: {
    color:    '#9aa0a6',
    fontSize: '13px',
  },
  tagContainer: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  tag: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    fontSize:   '13px',
    color:      '#3c4043',
  },
  barBg: {
    flex:            1,
    height:          '6px',
    backgroundColor: '#e8eaed',
    borderRadius:    '3px',
    overflow:        'hidden',
  },
  barFill: {
    height:          '100%',
    backgroundColor: '#1a73e8',
    borderRadius:    '3px',
    transition:      'width 0.3s ease',
  }
};

export default ProfilePanel;