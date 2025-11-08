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
      const payload = { assignedSalesId: salesId, assignedPlanningId: planningId };
      const response = await apiClient.post(`/v1/rfqs/${rfqId}/assign`, payload);
      return response.data;
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
  }
};
