import apiClient from './apiConfig';

export const materialStockService = {
  // Get all material stocks with pagination, search and filter
  getAllMaterialStocks: async (page = 0, size = 10, search, receivedDate) => {
    try {
      const params = { page, size };
      if (search && search.trim()) params.search = search.trim();
      if (receivedDate) params.receivedDate = receivedDate;

      const response = await apiClient.get('/v1/production/material-stock', { params });
      // Handle PageResponse
      if (response.data && response.data.content) {
        return response.data;
      }
      // Fallback for backward compatibility
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching material stocks:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch material stocks');
    }
  },

  // Get material stock by ID
  getMaterialStockById: async (id) => {
    try {
      const response = await apiClient.get(`/v1/production/material-stock/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching material stock:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch material stock');
    }
  },

  // Create material stock
  createMaterialStock: async (materialStockData) => {
    try {
      const response = await apiClient.post('/v1/production/material-stock', materialStockData);
      return response.data;
    } catch (error) {
      console.error("Error creating material stock:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create material stock');
    }
  },

  // Update material stock
  updateMaterialStock: async (id, materialStockData) => {
    try {
      const response = await apiClient.put(`/v1/production/material-stock/${id}`, materialStockData);
      return response.data;
    } catch (error) {
      console.error("Error updating material stock:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update material stock');
    }
  },


};

