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
      '/auth/internal/login',
      '/auth/customer/forgot-password',
      '/auth/customer/verify-reset-code'
    ];

    // If the request URL is one of the public routes, don't add the token
    if (noAuthRoutes.some(route => config.url.includes(route))) {
      return config;
    }

    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest =
        requestUrl.includes('/auth/customer/login') ||
        requestUrl.includes('/auth/internal/login') ||
        requestUrl.includes('/auth/customer/register') ||
        requestUrl.includes('/auth/customer/forgot-password') ||
        requestUrl.includes('/auth/customer/verify-reset-code');

      if (!isAuthRequest) {
        const lastLoginType = localStorage.getItem('lastLoginType');

        // Clear auth data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('lastLoginType');

        window.location.href = lastLoginType === 'internal' ? '/internal-login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
