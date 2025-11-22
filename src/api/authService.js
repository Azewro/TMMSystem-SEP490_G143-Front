import apiClient from './apiConfig';
import { API_ENDPOINTS } from '../utils/constants';

export const authService = {
  // Customer Login
  customerLogin: async (email, password) => {
    try {
      const response = await apiClient.post('/v1/auth/customer/login', {
        email,
        password
      });
      
      if (response.data.accessToken) {
        // Store user data in session storage (customer flow)
        sessionStorage.setItem('userToken', response.data.accessToken);
        sessionStorage.setItem('userEmail', response.data.email);
        sessionStorage.setItem('userName', response.data.name || response.data.email);
        sessionStorage.setItem('userRole', 'CUSTOMER');
        sessionStorage.setItem('customerId', response.data.customerId);
        sessionStorage.removeItem('userId'); // not applicable for customers
        
        return { ...response.data, customerId: response.data.customerId };
      }
      
      throw new Error('Login failed - no access token');
    } catch (error) {
      // Check if it's a credentials error (401 or specific error messages)
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.response?.data || '';
      const errorMessageLower = errorMessage.toLowerCase();
      
      if (status === 401 || 
          errorMessageLower.includes('invalid credentials') ||
          errorMessageLower.includes('customer not found') ||
          errorMessageLower.includes('user not found') ||
          errorMessageLower.includes('sai') ||
          errorMessageLower.includes('không đúng')) {
        throw new Error('Tài khoản hoặc mật khẩu không đúng');
      }
      
      throw new Error(errorMessage || 'Đăng nhập thất bại');
    }
  },

  // Internal User Login (Director, Admin, etc.)
  internalLogin: async (email, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.INTERNAL_LOGIN, {
        email,
        password
      });
      
      if (response.data.accessToken) {
        // Store user data in session storage (internal flow)
        sessionStorage.setItem('userToken', response.data.accessToken);
        sessionStorage.setItem('userEmail', response.data.email);
        sessionStorage.setItem('userName', response.data.name || response.data.email);
        sessionStorage.setItem('userRole', response.data.role);
        sessionStorage.setItem('userId', response.data.userId);
        sessionStorage.setItem('employeeCode', response.data.employeeCode); // Persist employeeCode
        sessionStorage.removeItem('customerId'); // not applicable for internal users
        
        return response.data;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      // Check if it's a credentials error (401 or specific error messages)
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.response?.data || '';
      const errorMessageLower = errorMessage.toLowerCase();
      
      if (status === 401 || 
          errorMessageLower.includes('invalid credentials') ||
          errorMessageLower.includes('user not found') ||
          errorMessageLower.includes('customer not found') ||
          errorMessageLower.includes('sai') ||
          errorMessageLower.includes('không đúng') ||
          errorMessageLower.includes('inactive')) {
        throw new Error('Tài khoản hoặc mật khẩu không đúng');
      }
      
      throw new Error(errorMessage || 'Đăng nhập thất bại');
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
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('customerId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('employeeCode'); // Clear employeeCode on logout
    sessionStorage.removeItem('returnTo');

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
      token: sessionStorage.getItem('userToken'),
      email: sessionStorage.getItem('userEmail'),
      name: sessionStorage.getItem('userName'),
      role: sessionStorage.getItem('userRole'),
      customerId: sessionStorage.getItem('customerId'),
      userId: sessionStorage.getItem('userId'),
      employeeCode: sessionStorage.getItem('employeeCode'), // Retrieve employeeCode
    };
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!sessionStorage.getItem('userToken');
  },

  // Change password for internal users
  changePassword: async (email, currentPassword, newPassword) => {
    try {
      const response = await apiClient.post('/v1/auth/change-password', {
        email,
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data || 'Đổi mật khẩu thất bại');
    }
  },

  // Change password for customers
  changeCustomerPassword: async (email, currentPassword, newPassword) => {
    try {
      const response = await apiClient.post('/v1/auth/customer/change-password', {
        email,
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data || 'Đổi mật khẩu thất bại');
    }
  },

  // Forgot password for internal users
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/v1/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    }
  },

  // Forgot password for customers
  customerForgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/v1/auth/customer/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    }
  },

  // Verify reset code for internal users
  verifyResetCode: async (email, code) => {
    try {
      const response = await apiClient.post('/v1/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn');
    }
  },

  // Verify reset code for customers
  customerVerifyResetCode: async (email, code) => {
    try {
      const response = await apiClient.post('/v1/auth/customer/verify-reset-code', { email, code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn');
    }
  },

  // Get customer profile
  getCustomerProfile: async () => {
    try {
      const response = await apiClient.get('/v1/auth/customer/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin cá nhân');
    }
  }
};