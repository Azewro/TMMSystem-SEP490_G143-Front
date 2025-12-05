import apiClient from './apiConfig';

export const orderService = {
  getAllOrders: async () => {
    try {
      const response = await apiClient.get('/v1/production/orders');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách đơn hàng');
    }
  },

  getOrderById: async (id) => {
    try {
      const response = await apiClient.get(`/v1/production/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải chi tiết đơn hàng');
    }
  },

  getOrdersByQuotationId: async (quotationId) => {
    try {
      const response = await apiClient.get(`/v1/production/orders/by-quotation/${quotationId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching orders by quotation:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách đơn hàng theo báo giá');
    }
  }
};
