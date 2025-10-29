import apiClient from './apiConfig';

export const productionPlanService = {
  getAll: async () => {
    const response = await apiClient.get('/v1/production-plans');
    return response.data;
  },

  getById: async (planId) => {
    const response = await apiClient.get(`/v1/production-plans/${planId}`);
    return response.data;
  },

  getPendingApproval: async () => {
    const response = await apiClient.get('/v1/production-plans/pending-approval');
    return response.data;
  },

  submitForApproval: async (planId, notes) => {
    const response = await apiClient.put(`/v1/production-plans/${planId}/submit`, { notes });
    return response.data;
  },

  approvePlan: async (planId, approvalNotes) => {
    const response = await apiClient.put(`/v1/production-plans/${planId}/approve`, { approvalNotes });
    return response.data;
  },

  rejectPlan: async (planId, rejectionReason) => {
    const response = await apiClient.put(`/v1/production-plans/${planId}/reject`, { rejectionReason });
    return response.data;
  }
};