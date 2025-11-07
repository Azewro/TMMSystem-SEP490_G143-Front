import apiClient from './apiConfig';
import { API_ENDPOINTS } from '../utils/constants';

export const authService = {
  // Request OTP for customer login
  requestLoginOtp: async (emailOrPhone) => {
    try {
      console.log('Requesting OTP for:', emailOrPhone);
      const response = await apiClient.post('/v1/auth/customer/customer-login', { emailOrPhone });
      console.log('Request OTP response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request OTP error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Gửi mã OTP thất bại');
    }
  },

  // Verify OTP and complete customer login
  verifyLoginOtp: async (emailOrPhone, otp) => {
    try {
      console.log('Verifying OTP for:', emailOrPhone);
      const response = await apiClient.post('/v1/auth/customer/verify-login-otp', { emailOrPhone, otp });
      console.log('Verify OTP response:', response.data);
      
      if (response.data.accessToken) {
        // Store user data
        localStorage.setItem('userToken', response.data.accessToken);
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userName', response.data.name || response.data.email);
        localStorage.setItem('userRole', 'CUSTOMER');
        localStorage.setItem('customerId', response.data.customerId);
        
        return { ...response.data, customerId: response.data.customerId };
      }
      
      throw new Error('Login failed - no access token');
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Xác thực OTP thất bại');
    }
  },

  /*
  // Customer Login (Password-based - DEPRECATED)
  customerLogin: async (email, password) => {
    try {
      console.log('Attempting customer login with:', { email, password: 'hidden' });
      console.log('Using endpoint:', API_ENDPOINTS.AUTH.CUSTOMER_LOGIN);
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CUSTOMER_LOGIN, {
        email,
        password
      });
      
      console.log('Customer login response:', response.data);
      
      if (response.data.accessToken) {
        // Store user data
        localStorage.setItem('userToken', response.data.accessToken);
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userName', response.data.name || response.data.email);
        localStorage.setItem('userRole', 'CUSTOMER');
        localStorage.setItem('customerId', response.data.customerId);
        
        return { ...response.data, customerId: response.data.customerId };
      }
      
      throw new Error('Login failed - no access token');
    } catch (error) {
      console.error('Customer login error details:', error.response?.data);
      console.error('Customer login error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  },
  */

  // Internal User Login (Director, Admin, etc.)
  internalLogin: async (email, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.INTERNAL_LOGIN, {
        email,
        password
      });
      
      if (response.data.accessToken) {
        // Store user data
        localStorage.setItem('userToken', response.data.accessToken);
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userName', response.data.name || response.data.email);
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('userId', response.data.userId);
        
        return response.data;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  },

  // Customer Registration
  registerCustomer: async (email, password) => {
    try {
      const response = await apiClient.post('/v1/auth/customer/register', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('customerId');
    localStorage.removeItem('userId');
  },

  // Get current user data
  getCurrentUser: () => {
    return {
      token: localStorage.getItem('userToken'),
      email: localStorage.getItem('userEmail'),
      name: localStorage.getItem('userName'),
      role: localStorage.getItem('userRole'),
      customerId: localStorage.getItem('customerId'),
      userId: localStorage.getItem('userId'),
    };
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('userToken');
  }
};
