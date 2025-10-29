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
  }
};
