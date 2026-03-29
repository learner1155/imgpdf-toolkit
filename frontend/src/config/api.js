// API Configuration
// Production: empty string → relative URLs (same domain on Render)
// Development: localhost:5000
const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

export default API_URL;
