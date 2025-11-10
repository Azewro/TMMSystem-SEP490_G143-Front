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

  // Create customer
  createCustomer: async (customerData) => {
    try {
      const response = await apiClient.post('/v1/customers', customerData);
      return response.data;
    } catch (error) {
      console.error("Error creating customer:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create customer');
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    try {
      const response = await apiClient.put(`/v1/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error("Error updating customer:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update customer');
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      await apiClient.delete(`/v1/customers/${id}`);
    } catch (error) {
      console.error("Error deleting customer:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to delete customer');
    }
  },

  // Set customer active status
  setCustomerActive: async (id, active) => {
    try {
      await apiClient.patch(`/v1/customers/${id}/active`, null, {
        params: { value: active }
      });
    } catch (error) {
      console.error("Error setting customer active status:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update customer status');
    }
  }
};