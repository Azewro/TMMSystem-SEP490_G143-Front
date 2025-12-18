// API Configuration - reads from environment variable with fallback to production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tmmsystem-sep490g143-production.up.railway.app';
// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    CUSTOMER_LOGIN: '/v1/auth/login',
    CUSTOMER_REGISTER: '/v1/auth/customer/register',
    INTERNAL_LOGIN: '/v1/auth/user/login',
  },
  CUSTOMERS: '/v1/customers',
  QUOTATIONS: '/v1/quotations',
  CONTRACTS: '/v1/contracts',
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  SALE_STAFF: 'SALE_STAFF',
  PLANNING_DEPT: 'PLANNING_DEPT',
  DIRECTOR: 'DIRECTOR',
  ADMIN: 'ADMIN'
};

// Routes
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  INTERNAL_DASHBOARD: '/internal/dashboard'
};
