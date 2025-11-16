import apiClient from './apiConfig';

export const productService = {
  // Get all products
  getAllProducts: async () => {
    const response = await apiClient.get('/v1/products');
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await apiClient.get(`/v1/products/${id}`);
    return response.data;
  },

  // Get product categories
  getProductCategories: async () => {
    const response = await apiClient.get('/v1/product-categories');
    return response.data;
  },

  // Get all materials
  getAllMaterials: async () => {
    try {
      const response = await apiClient.get('/v1/products/materials');
      // Handle both array and PageResponse
      if (response.data && response.data.content) {
        return response.data.content;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching materials:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch materials');
    }
  }
};
