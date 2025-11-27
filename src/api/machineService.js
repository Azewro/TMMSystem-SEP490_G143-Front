import apiClient from './apiConfig';

export const machineService = {
  // Get all machines
  getAllMachines: async (page = 0, size = 10, search, type, status) => {
    const params = { page, size };
    if (search) params.search = search;
    if (type) params.type = type;
    if (status) params.status = status;

    const response = await apiClient.get('/v1/machines', { params });
    // Handle PageResponse
    if (response.data && response.data.content) {
      return response.data;
    }
    // Fallback for backward compatibility
    return Array.isArray(response.data) ? response.data : [];
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
  },

  // Reset machine status
  resetStatus: async () => {
    const response = await apiClient.post('/v1/machines/reset-status');
    return response.data;
  },

  // Get assignments
  getAssignments: async (id, page = 0, size = 10) => {
    const response = await apiClient.get(`/v1/machines/${id}/assignments`, {
      params: { page, size }
    });
    return response.data;
  },

  // Alias for getMachineById
  getMachine: async (id) => {
    return machineService.getMachineById(id);
  }
};

