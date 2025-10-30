import apiClient from './apiConfig';

const mapApiError = (error, fallbackMessage) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.statusText) {
    return `${fallbackMessage}: ${error.response.statusText}`;
  }
  return fallbackMessage;
};

export const quoteService = {
  /**
   * Customer creates a new RFQ (Request for Quotation)
   */
  submitQuoteRequest: async (rfqData) => {
    try {
      const userId = parseInt(localStorage.getItem('userId'), 10) || undefined;

      // The component is now responsible for the payload structure.
      // The service just adds the user ID from local storage.
      const payload = {
        ...rfqData,
        createdById: userId,
      };

      const response = await apiClient.post('/v1/rfqs', payload);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi gửi yêu cầu báo giá'));
    }
  },

  /**
   * Sales – list of RFQs
   */
  getAllQuoteRequests: async () => {
    try {
      const response = await apiClient.get('/v1/rfqs');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải danh sách yêu cầu báo giá'));
    }
  },

  getRFQDetails: async (rfqId) => {
    try {
      const response = await apiClient.get(`/v1/rfqs/${rfqId}`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải chi tiết RFQ'));
    }
  },

  /**
   * Shared helpers
   */
  getAllCustomers: async () => {
    try {
      const response = await apiClient.get('/v1/customers');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải danh sách khách hàng'));
    }
  },

  getCustomerById: async (customerId) => {
    try {
      const response = await apiClient.get(`/v1/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải thông tin khách hàng'));
    }
  },

  /**
   * RFQ workflow for Sales & Planning
   */
  sendRfq: async (rfqId) => {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/send`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi gửi RFQ'));
    }
  },

  preliminaryCheck: async (rfqId) => {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/preliminary-check`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi kiểm tra sơ bộ RFQ'));
    }
  },

  forwardToPlanning: async (rfqId) => {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/forward-to-planning`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi chuyển RFQ đến Phòng Kế hoạch'));
    }
  },

  receiveByPlanning: async (rfqId) => {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/receive-by-planning`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi Phòng Kế hoạch xác nhận đã nhận RFQ'));
    }
  },

  /**
   * Planning – quotation creation
   */
  getQuotePricing: async (rfqId) => {
    try {
      const response = await apiClient.post('/v1/quotations/calculate-price', {
        rfqId,
        profitMargin: 0
      });
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải dữ liệu tính giá'));
    }
  },

  calculateQuotePrice: async (rfqId, profitMargin) => {
    try {
      const response = await apiClient.post('/v1/quotations/recalculate-price', {
        rfqId,
        profitMargin
      });
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tính toán báo giá'));
    }
  },

  createQuote: async ({ rfqId, profitMargin, notes }) => {
    try {
      const planningUserId = parseInt(localStorage.getItem('userId'), 10) || undefined;
      const response = await apiClient.post('/v1/quotations/create-from-rfq', {
        rfqId,
        planningUserId,
        profitMargin,
        capacityCheckNotes: notes || 'Capacity checked by Planning Department'
      });
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tạo báo giá'));
    }
  },

  /**
   * Sales – quotation management
   */
  getAllQuotes: async () => {
    try {
      const response = await apiClient.get('/v1/quotations');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải danh sách báo giá'));
    }
  },

  getQuoteDetails: async (quoteId) => {
    try {
      const response = await apiClient.get(`/v1/quotations/${quoteId}`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải chi tiết báo giá'));
    }
  },

  sendQuoteToCustomer: async (quoteId) => {
    try {
      const response = await apiClient.post(`/v1/quotations/${quoteId}/send-to-customer`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi gửi báo giá cho khách hàng'));
    }
  },

  updateQuotationStatus: async (quotationId, status) => {
    try {
      if (status === 'ACCEPTED') {
        const response = await apiClient.post(`/v1/quotations/${quotationId}/approve`);
        return response.data;
      }
      if (status === 'REJECTED') {
        const response = await apiClient.post(`/v1/quotations/${quotationId}/reject`);
        return response.data;
      }
      throw new Error('Trạng thái báo giá không hợp lệ');
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi cập nhật trạng thái báo giá'));
    }
  },

  createOrderFromQuotation: async ({ quotationId }) => {
    try {
      const response = await apiClient.post(`/v1/quotations/${quotationId}/create-order`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tạo đơn hàng từ báo giá'));
    }
  },

  /**
   * Customer – quotation list
   */
  getCustomerQuotations: async (customerId) => {
    try {
      const response = await apiClient.get(`/v1/customers/${customerId}/quotations`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải báo giá của khách hàng'));
    }
  }
};
