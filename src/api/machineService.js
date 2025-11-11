import apiClient from './apiConfig';

export const machineService = {
  /**
   * Fetches all machines from the API.
   * @returns {Promise<Array>} A promise that resolves to an array of machine objects.
   */
  getAllMachines: async () => {
    try {
      const response = await apiClient.get('/v1/machines');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching machines:", error);
      throw new Error(error.response?.data?.message || 'Failed to fetch machines');
    }
  },
};
