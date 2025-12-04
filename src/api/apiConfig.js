import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Define routes that don't need authentication
    const noAuthRoutes = [
      '/auth/customer/login',
      '/auth/customer/register',
      '/auth/user/login',
      '/auth/internal/login',
      '/auth/customer/forgot-password',
      '/auth/customer/verify-reset-code',
      '/auth/forgot-password',
      '/auth/verify-reset-code'
    ];

    // If the request URL is one of the public routes, don't add the token
    if (noAuthRoutes.some(route => config.url.includes(route))) {
      return config;
    }

    const token =
      sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure custom headers (like X-User-Id) are preserved
    // Headers passed in config.headers should not be overwritten
    if (config.headers && typeof config.headers === 'object') {
      // Merge any existing headers - don't overwrite custom headers
      config.headers = { ...config.headers };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error message from backend
    if (error.response && error.response.data) {
      // If backend returns { "message": "..." } (new format)
      if (error.response.data.message) {
        error.message = error.response.data.message;
      }
      // If backend returns plain string (old format fallback)
      else if (typeof error.response.data === 'string') {
        error.message = error.response.data;
      }
    }

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest =
        requestUrl.includes('/auth/customer/login') ||
        requestUrl.includes('/auth/user/login') ||
        requestUrl.includes('/auth/internal/login') ||
        requestUrl.includes('/auth/customer/register') ||
        requestUrl.includes('/auth/customer/forgot-password') ||
        requestUrl.includes('/auth/customer/verify-reset-code') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/verify-reset-code');

      if (!isAuthRequest) {
        const userRole =
          sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

        // Clear auth data
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('customerId');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('returnTo');

        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('customerId');
        localStorage.removeItem('userId');

        const redirectTo =
          userRole && userRole.toUpperCase() !== 'CUSTOMER'
            ? '/internal-login'
            : '/login';
        window.location.href = redirectTo;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
