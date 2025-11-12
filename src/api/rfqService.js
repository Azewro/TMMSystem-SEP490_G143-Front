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
      const response = await apiClient.get('/v1/rfqs', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching RFQs:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch RFQs');
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

  async getDraftsUnassignedRfqs() {
    try {
      const response = await apiClient.get('/v1/rfqs/drafts/unassigned');
      return response.data;
    } catch (error) {
      console.error("Error fetching unassigned DRAFT RFQs:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch unassigned DRAFT RFQs');
    }
  },

  async getAssignedRfqsForSales() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }
      const response = await apiClient.get('/v1/rfqs/for-sales', {
        headers: {
          'X-User-Id': userId
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assigned RFQs for sales:", error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned RFQs for sales');
    }
  },

  async getAssignedRfqsForPlanning() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }
      const response = await apiClient.get('/v1/rfqs/for-planning', {
        headers: {
          'X-User-Id': userId
        }
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
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }

      // The endpoint might be expecting a specific format for the date.
      // Assuming yyyy-MM-dd from the previous findings.
      if (editData.expectedDeliveryDate) {
        editData.expectedDeliveryDate = new Date(editData.expectedDeliveryDate).toISOString().split('T')[0];
      }
      const response = await apiClient.patch(`/v1/rfqs/${rfqId}/sales-edit`, editData, {
        headers: {
          'X-User-Id': userId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error editing RFQ ${rfqId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to edit RFQ');
    }
  }
};
