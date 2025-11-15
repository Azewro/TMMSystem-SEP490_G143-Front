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

  async assignRfq(rfqId, salesId, planningId) {
    try {
      // Assign Sales
      await apiClient.post(`/v1/rfqs/${rfqId}/assign-sales`, { assignedSalesId: salesId });

      // Assign Planning
      await apiClient.post(`/v1/rfqs/${rfqId}/assign-planning`, { assignedPlanningId: planningId });

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
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }
      const params = { page, size };
      if (search) params.search = search;
      if (status) params.status = status;
      
      const response = await apiClient.get('/v1/rfqs/for-sales', {
        headers: {
          'X-User-Id': userId
        },
        params
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assigned RFQs for sales:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned RFQs for sales');
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
