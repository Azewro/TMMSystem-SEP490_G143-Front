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
      // Clear auth data and redirect to login
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
