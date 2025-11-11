import apiClient from './apiConfig';

export const machineService = {
  // Get all machines
  getAllMachines: async () => {
    const response = await apiClient.get('/v1/machines');
    return response.data;
  },

  // Get machine by ID
  getMachineById: async (id) => {
    const response = await apiClient.get(`/v1/machines/${id}`);
    return response.data;
  },

  // Create machine
  createMachine: async (machineData) => {
    try {
      const response = await apiClient.post('/v1/machines', machineData);
      return response.data;
    } catch (error) {
      console.error("Error creating machine:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create machine');
    }
  },

  // Update machine
  updateMachine: async (id, machineData) => {
    try {
      const response = await apiClient.put(`/v1/machines/${id}`, machineData);
      return response.data;
    } catch (error) {
      console.error("Error updating machine:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update machine');
    }
  },

  // Delete machine
  deleteMachine: async (id) => {
    try {
      await apiClient.delete(`/v1/machines/${id}`);
    } catch (error) {
      console.error("Error deleting machine:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to delete machine');
    }
  }
};

