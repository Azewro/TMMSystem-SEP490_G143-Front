import apiClient from './apiConfig';

export const userService = {
  async getAllUsers() {
    try {
      const response = await apiClient.get('/api/admin/users');
      return response.data;
    } catch (error) {
      console.error("Error fetching all users:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  async getUserById(id) {
    try {
      const response = await apiClient.get(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  async createUser(userData) {
    try {
      const response = await apiClient.post('/api/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await apiClient.put(`/api/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  async deleteUser(id) {
    try {
      await apiClient.delete(`/api/admin/users/${id}`);
    } catch (error) {
      console.error("Error deleting user:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  async setUserActive(id, active) {
    try {
      await apiClient.patch(`/v1/admin/users/${id}/active`, null, {
        params: { value: active }
      });
    } catch (error) {
      console.error("Error setting user active status:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update user status');
    }
  },
};