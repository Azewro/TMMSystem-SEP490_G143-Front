import apiClient from './apiConfig';

const createRfq = async (rfqData, isAuthenticated) => {
  try {
    let response;
    if (isAuthenticated) {
      // API for logged-in customers
      response = await apiClient.post('/v1/rfqs', rfqData);
    } else {
      // API for public/guest users
      response = await apiClient.post('/v1/rfqs/public', rfqData);
    }
    return response.data;
  } catch (error) {
    console.error("Error creating RFQ:", error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to create RFQ');
  }
};

export const rfqService = {
  createRfq,

  async getRfqs(params = {}) {
    try {
      // Ensure pagination parameters
      const paginationParams = {
        page: params.page !== undefined ? params.page : 0,
        size: params.size !== undefined ? params.size : 10
      };
      // Add optional parameters (only if they have truthy values)
      if (params.search && params.search.trim()) paginationParams.search = params.search.trim();
      if (params.status && params.status.trim()) paginationParams.status = params.status.trim();
      if (params.customerId) paginationParams.customerId = params.customerId;
      
      const response = await apiClient.get('/v1/rfqs', { params: paginationParams });
      return response.data;
    } catch (error) {
      console.error("Error fetching RFQs:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch RFQs';
      throw new Error(errorMessage);
    }
  },

  async assignRfq(rfqId, salesId) {
    try {
      // Assign Sales
      await apiClient.post(`/v1/rfqs/${rfqId}/assign-sales`, { assignedSalesId: salesId });

      return { success: true, message: 'RFQ assigned successfully' };
    } catch (error) {
      console.error(`Error assigning RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to assign RFQ');
    }
  },

  /**
   * Sends a draft RFQ, changing its status from DRAFT to SENT.
   * @param {string|number} rfqId - The ID of the RFQ to send.
   * @returns {Promise<Object>} A promise that resolves to the response data.
   */
  async sendRfq(rfqId) {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/send`);
      return response.data;
    } catch (error) {
      console.error(`Error sending RFQ ${rfqId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send RFQ');
    }
  },

  async getDraftsUnassignedRfqs(page = 0, size = 10) {
    try {
      const response = await apiClient.get('/v1/rfqs/drafts/unassigned', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching unassigned DRAFT RFQs:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch unassigned DRAFT RFQs');
    }
  },

  async getAssignedRfqsForSales(page = 0, size = 10, search, status) {
    try {
      const userIdStr = sessionStorage.getItem('userId');
      if (!userIdStr) {
        throw new Error('User ID not found. Please log in.');
      }
      
      // Backend expects Long (numeric) in header
      // Spring can convert string to Long, but ensure it's a valid number
      const userId = parseInt(userIdStr, 10);
      if (isNaN(userId) || userId <= 0) {
        throw new Error('Invalid User ID format. Please log in again.');
      }
      
      // Build params object - only include non-empty values
      const params = { 
        page: page || 0, 
        size: size || 10 
      };
      
      // Only add search parameter if it's a non-empty string after trimming
      // Backend checks: search != null && !search.trim().isEmpty()
      if (search && typeof search === 'string') {
        const trimmedSearch = search.trim();
        if (trimmedSearch.length > 0) {
          params.search = trimmedSearch;
        }
      }
      
      // Only add status parameter if it has a value
      // Backend checks: status != null && !status.trim().isEmpty()
      if (status && typeof status === 'string') {
        const trimmedStatus = status.trim();
        if (trimmedStatus.length > 0) {
          params.status = trimmedStatus;
        }
      }
      
      // Log request details for debugging
      console.log('Request to /v1/rfqs/for-sales:', {
        userId: userId,
        params: params,
        headerValue: userId.toString()
      });
      
      // Ensure header is set correctly - explicitly set headers
      const config = {
        params: params
      };
      
      // Set headers explicitly to ensure they're not lost
      // Use both formats to ensure compatibility
      if (!config.headers) {
        config.headers = {};
      }
      // Set header with exact case as backend expects
      config.headers['X-User-Id'] = userId.toString();
      // Also set lowercase version for compatibility
      config.headers['x-user-id'] = userId.toString();
      
      console.log('Request config:', {
        url: '/v1/rfqs/for-sales',
        method: 'GET',
        headers: config.headers,
        params: config.params
      });
      
      const response = await apiClient.get('/v1/rfqs/for-sales', config);
      return response.data;
    } catch (error) {
      // Enhanced error logging - log full response for debugging
      console.error("Error fetching assigned RFQs for sales:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        fullResponse: error.response,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          params: error.config?.params
        }
      });
      
      // Handle 400 Bad Request specifically
      if (error.response?.status === 400) {
        // Try to get error message from various possible fields
        const responseData = error.response?.data;
        let backendMessage = 'Yêu cầu không hợp lệ';
        
        if (responseData) {
          // Try different possible error message fields
          backendMessage = responseData.message 
            || responseData.error 
            || responseData.detail
            || responseData.msg
            || (typeof responseData === 'string' ? responseData : JSON.stringify(responseData))
            || `Bad Request: ${error.response?.statusText || 'Invalid request parameters'}`;
        } else {
          backendMessage = `Bad Request: ${error.response?.statusText || 'Invalid request parameters'}`;
        }
        
        console.error('Backend error message:', backendMessage);
        throw new Error(backendMessage);
      }
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.response?.data?.detail
        || error.message 
        || 'Failed to fetch assigned RFQs for sales';
      throw new Error(errorMessage);
    }
  },

  async getAssignedRfqsForPlanning(page = 0, size = 10, search, status) {
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }
      const params = { page, size };
      if (search) params.search = search;
      if (status) params.status = status;
      
      const response = await apiClient.get('/v1/rfqs/for-planning', {
        headers: {
          'X-User-Id': userId
        },
        params
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assigned RFQs for planning:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned RFQs for planning');
    }
  },

  async getRfqById(rfqId) {
    try {
      const response = await apiClient.get(`/v1/rfqs/${rfqId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch RFQ details');
    }
  },

  async confirmRfq(rfqId, note) {
    try {
      // Corrected the endpoint URL by removing "/status"
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/preliminary-check`, { note });
      return response.data;
    } catch (error) {
      console.error(`Error confirming RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to confirm RFQ');
    }
  },

  async forwardRfqToPlanning(rfqId) {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/forward-to-planning`);
      return response.data;
    } catch (error) {
      console.error(`Error forwarding RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to forward RFQ to planning');
    }
  },

  async salesEditRfq(rfqId, editData) {
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }

      // Ensure expectedDeliveryDate is in YYYY-MM-DD format if provided
      // Don't modify if already formatted correctly
      if (editData.expectedDeliveryDate) {
        const dateStr = editData.expectedDeliveryDate;
        // If it's already in YYYY-MM-DD format, keep it
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // Otherwise, try to format it
          try {
            editData.expectedDeliveryDate = new Date(dateStr).toISOString().split('T')[0];
          } catch (e) {
            console.warn('Could not format expectedDeliveryDate:', e);
          }
        }
      }

      console.log(`PATCH /v1/rfqs/${rfqId}/sales-edit with payload:`, editData);
      
      const response = await apiClient.patch(`/v1/rfqs/${rfqId}/sales-edit`, editData, {
        headers: {
          'X-User-Id': userId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error editing RFQ ${rfqId}:`, error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to edit RFQ';
      throw new Error(errorMessage);
    }
  },

  async deleteRfq(rfqId) {
    try {
      await apiClient.delete(`/v1/rfqs/${rfqId}`);
    } catch (error) {
      console.error(`Error deleting RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa RFQ');
    }
  },

  async cancelRfq(rfqId) {
    try {
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Lỗi khi hủy RFQ');
    }
  }
};
