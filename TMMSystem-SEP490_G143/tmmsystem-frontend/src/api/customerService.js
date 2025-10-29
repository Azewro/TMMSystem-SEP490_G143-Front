import apiClient from './apiConfig';

export const customerService = {
  // Get all customers
  getAllCustomers: async () => {
    const response = await apiClient.get('/v1/customers');
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const response = await apiClient.get(`/v1/customers/${id}`);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await apiClient.put(`/v1/customers/${id}`, customerData);
    return response.data;
  }
};
