// frontend/src/utils/apiConfig.js

/**
 * Get the appropriate API base URL based on environment
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // Determine the correct backend URL - prioritize production detection
  const backendUrl = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_BASE || 'https://magendovrimadom-backend.railway.app')
    : (import.meta.env.VITE_API_BASE || 'http://localhost:3001');
  
  console.log('🌐 Using backend URL:', backendUrl);
  console.log('🔧 Environment:', import.meta.env.PROD ? 'production' : 'development');
  
  return backendUrl;
};

/**
 * Make an API request with proper URL handling
 * @param {string} endpoint - The API endpoint (e.g., '/users/123/update')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}/api${endpoint}`;
  
  console.log('📡 Making API request to:', url);
  console.log('📦 Request options:', options);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  console.log('📡 Response status:', response.status);
  console.log('📡 Response ok:', response.ok);
  
  return response;
};
