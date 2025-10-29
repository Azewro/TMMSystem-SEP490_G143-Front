import apiClient from './apiConfig';

export const quotationService = {
  // Get all quotations
  getAllQuotations: async () => {
    const response = await apiClient.get('/v1/quotations');
    return response.data;
  },

  // Get quotation by ID
  getQuotationById: async (id) => {
    const response = await apiClient.get(`/v1/quotations/${id}`);
    return response.data;
  },

  // Customer approve quotation
  approveQuotation: async (id) => {
    const response = await apiClient.post(`/v1/quotations/${id}/approve`);
    return response.data;
  },

  // Customer reject quotation
  rejectQuotation: async (id) => {
    const response = await apiClient.post(`/v1/quotations/${id}/reject`);
    return response.data;
  },

  // Get customer quotations
  getCustomerQuotations: async (customerId) => {
    const response = await apiClient.get(`/v1/quotations/customer/${customerId}`);
    return response.data;
  }
};
