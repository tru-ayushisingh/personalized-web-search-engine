// frontend/src/components/LocationBadge.jsx

// This component shows the detected city at the top of results
// Props:
//   location: { city, region, country, display_name }
//   onClear: function to call when user wants to remove location

function LocationBadge({ location, onClear }) {
  // Don't show anything if no city was detected
  if (!location || !location.city) return null;

  return (
    <div style={styles.badge}>
      {/* Pin emoji + city name */}
      <span>📍 {location.display_name}</span>

      {/* Small X button to clear location */}
      <button onClick={onClear} style={styles.clearBtn}>
        ✕
      </button>
    </div>
  );
}

const styles = {
  badge: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '8px',
    backgroundColor: '#e8f0fe',
    color:          '#1a73e8',
    padding:        '6px 12px',
    borderRadius:   '20px',
    fontSize:       '14px',
    marginBottom:   '12px',
  },
  clearBtn: {
    background:  'none',
    border:      'none',
    cursor:      'pointer',
    color:       '#1a73e8',
    fontSize:    '12px',
    padding:     '0 2px',
  }
};

export default LocationBadge;