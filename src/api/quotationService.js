import apiClient from './apiConfig';

export const quotationService = {
  // Get all quotations
  getAllQuotations: async (page = 0, size = 10, search, status) => {
    const params = { page, size };
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await apiClient.get('/v1/quotations', { params });
    // Handle PageResponse
    if (response.data && response.data.content) {
      return response.data;
    }
    // Fallback for backward compatibility
    return response.data;
  },

  // Alias for getAllQuotations
  getAllQuotes: async function (page = 0, size = 10, search, status) {
    return this.getAllQuotations(page, size, search, status);
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
  getCustomerQuotations: async (customerId, page = 0, size = 10, search, status, sortBy, sortOrder, selectedDate) => {
    const params = { page, size };
    // Normalize search: trim and replace multiple spaces with single space
    if (search && typeof search === 'string') {
      const normalizedSearch = search.trim().replace(/\s+/g, ' ');
      if (normalizedSearch.length > 0) {
        params.search = normalizedSearch;
      }
    }
    // Add status filter
    if (status && typeof status === 'string' && status.trim()) {
      params.status = status.trim();
    }
    // Add sort parameters
    if (sortBy && typeof sortBy === 'string' && sortBy.trim()) {
      params.sortBy = sortBy.trim();
    }
    if (sortOrder && typeof sortOrder === 'string' && sortOrder.trim()) {
      params.sortOrder = sortOrder.trim();
    }
    // Add selectedDate for date-based sorting
    if (selectedDate && typeof selectedDate === 'string' && selectedDate.trim()) {
      params.selectedDate = selectedDate.trim();
    }

    const response = await apiClient.get(`/v1/quotations/customer/${customerId}`, { params });
    // Handle PageResponse
    if (response.data && response.data.content) {
      return response.data;
    }
    // Fallback for backward compatibility
    return response.data;
  },

  getQuoteFileUrl: async (quotationId) => {
    try {
      const response = await apiClient.get(`/v1/quotations/${quotationId}/file-url`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy URL file báo giá');
    }
  },

  uploadSignedQuotation: async (quotationId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`/v1/quotations/${quotationId}/upload-signed`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi upload file báo giá');
    }
  },

  // Get quotations assigned to a specific Sales
  getSalesQuotations: async (page = 0, size = 10, search, status) => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    const params = { page, size };
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await apiClient.get('/v1/quotations/for-sales', {
      params,
      headers: {
        'X-User-Id': userId
      }
    });
    // Handle PageResponse
    if (response.data && response.data.content) {
      return response.data;
    }
    // Fallback for backward compatibility
    return response.data;
  }
};
