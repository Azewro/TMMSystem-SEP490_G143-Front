import apiClient from './apiConfig';

export const roleService = {
  async getAllRoles() {
    try {
      const response = await apiClient.get('/v1/roles');
      return response.data;
    } catch (error) {
      console.error("Error fetching roles:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch roles');
    }
  },

  async getRoleById(id) {
    try {
      const response = await apiClient.get(`/v1/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching role:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch role');
    }
  },
};
