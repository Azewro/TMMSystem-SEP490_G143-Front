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
};
