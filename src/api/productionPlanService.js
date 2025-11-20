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

    async submitForApproval(planId, notes) {
        const response = await apiClient.put(`/v1/production-plans/${planId}/submit`, { notes });
        return response.data;
    },

    async calculateSchedule(planId) {
        const response = await apiClient.post(`/v1/production-plans/${planId}/calculate-schedule`);
        return response.data;
    },

    async approve(planId, notes) {
        const response = await apiClient.put(`/v1/production-plans/${planId}/approve`, { approvalNotes: notes });
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

  // Create plan from lot - according to Production Planning Guide
  createPlanFromLot: async (lotId) => {
    try {
      // The API spec confirms this is a POST with a query param and no body.
      // The 400 error might be due to the Content-Type header. Let's try removing it for this call.
      const response = await apiClient.post(`/v1/production-plans/create-from-lot?lotId=${lotId}`, null, {
        headers: {
          'Content-Type': null
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo kế hoạch sản xuất từ lô.');
    }
  },

  getProductionLots: async (status) => {
    try {
      const params = {};
      if (status) {
        params.status = status;
      }
      const response = await apiClient.get('/v1/production-lots', { params });
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

  // Get contracts/orders for a lot - according to Production Planning Guide
  getLotContracts: async (lotId) => {
    try {
      const response = await apiClient.get(`/v1/production-lots/${lotId}/contracts`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách hợp đồng của lô.');
    }
  },

  // Get stages for a plan - according to Production Planning Guide
  getPlanStages: async (planId) => {
    try {
      const response = await apiClient.get(`/v1/production-plans/${planId}/stages`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách công đoạn.');
    }
  },

  // Get machine suggestions for a stage - according to Production Planning Guide
  getMachineSuggestions: async (stageId) => {
    try {
      const response = await apiClient.get(`/v1/production-plans/stages/${stageId}/machine-suggestions`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải gợi ý máy móc.');
    }
  },

  // Auto-assign machine to a stage - according to Production Planning Guide
  autoAssignMachine: async (stageId) => {
    try {
      const response = await apiClient.post(`/v1/production-plans/stages/${stageId}/auto-assign-machine`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tự động gán máy móc.');
    }
  },

  // Assign in-charge user to a stage - according to Production Planning Guide
  assignInCharge: async (stageId, userId) => {
    try {
      const response = await apiClient.put(`/v1/production-plans/stages/${stageId}/assign-incharge?userId=${userId}`, null);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi gán người phụ trách.');
    }
  },

  // Assign QC user to a stage - according to Production Planning Guide
  assignQC: async (stageId, userId) => {
    try {
      const response = await apiClient.put(`/v1/production-plans/stages/${stageId}/assign-qc?userId=${userId}`, null);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi gán người kiểm tra chất lượng.');
    }
  },

  // Check conflicts for a stage - according to Production Planning Guide
  checkConflicts: async (stageId) => {
    try {
      const response = await apiClient.get(`/v1/production-plans/stages/${stageId}/check-conflicts`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi kiểm tra xung đột.');
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

  // Get material consumption with custom waste percentage - according to Production Planning Guide
  getMaterialConsumptionWithWaste: async (planId, wastePercentage = 0.1) => {
    try {
      const response = await apiClient.get(`/v1/material-consumption/production-plan/${planId}/with-waste`, {
        params: { wastePercentage }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải dữ liệu tiêu hao NVL với tỷ lệ hao hụt.');
    }
  },

  // Get material availability - according to Production Planning Guide
  getMaterialAvailability: async (planId) => {
    try {
      const response = await apiClient.get(`/v1/material-consumption/production-plan/${planId}/availability`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi kiểm tra khả dụng NVL.');
    }
  },

  // Update stage - according to Production Planning Guide
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