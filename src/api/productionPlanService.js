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
  },

  createPlanFromContract: async (contractId) => {
    try {
      const response = await apiClient.post('/v1/production-plans', { contractId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo kế hoạch sản xuất từ hợp đồng.');
    }
  },

  getProductionLots: async (status = 'READY_FOR_PLANNING') => {
    try {
      const response = await apiClient.get('/v1/production-lots', { params: { status } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách lô sản xuất.');
    }
  },

  getProductionLotById: async (lotId) => {
    try {
      const response = await apiClient.get(`/v1/production-lots/${lotId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải chi tiết lô sản xuất.');
    }
  },

  getMaterialConsumption: async (planId) => {
    try {
      const response = await apiClient.get(`/v1/material-consumption/production-plan/${planId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải dữ liệu tiêu hao NVL.');
    }
  },

  updateStage: async (stageId, stageData) => {
    try {
      const response = await apiClient.put(`/v1/production-plans/stages/${stageId}`, stageData);
      return response.data;
    } catch (error) {
      console.error(`Error updating stage ${stageId}:`, error.response?.data);
      throw new Error(error.response?.data?.message || `Lỗi khi cập nhật công đoạn ${stageId}`);
    }
  }
};