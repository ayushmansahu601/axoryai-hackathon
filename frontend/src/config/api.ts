
// API Configuration
export const API_CONFIG = {
  // Railway deployment backend URL
  BACKEND_URL: import.meta.env.PROD 
    ? 'http://127.0.0.1:8000'  // Production Railway URL
    : 'http://127.0.0.1:8000',  // Use Railway URL for development too
  
  ENDPOINTS: {
    PROCESS_VIDEO: '/analyze',  // Changed from /process-video to /analyze to match backend
    HEALTH: '/health',
    RESULTS: '/results'
    // ANALYZE:'/new_analyze' // New endpoint for the latest backend changes
  }
} as const;

export const getBackendUrl = () => API_CONFIG.BACKEND_URL;
