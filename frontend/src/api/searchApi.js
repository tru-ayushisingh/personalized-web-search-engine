// frontend/src/api/searchApi.js
import axios from 'axios';

// Base URL of your Flask backend
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance — all requests go to Flask
// withCredentials: true means session cookies are sent
// so Flask remembers who you are between requests
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// ── SEARCH ──────────────────────────────────────────────────────────────────
// Sends query + optional location to Flask /api/search
// Returns: { results, location, query }
export const searchQuery = async (query, lat = null, lng = null) => {
  const response = await api.post('/search', { query, lat, lng });
  return response.data;
};

// ── CLICK TRACKING ───────────────────────────────────────────────────────────
// Tells Flask which result the user clicked
// Flask uses this to update the user's interest profile
export const recordClick = async (query, url, title, snippet) => {
  await api.post('/click', { query, url, title, snippet });
};

// ── PROFILE ──────────────────────────────────────────────────────────────────
// Gets the user's current interest profile from Flask
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

// ── RESET PROFILE ─────────────────────────────────────────────────────────────
// Clears the user's interest history
export const resetProfile = async () => {
  await api.delete('/profile');
};