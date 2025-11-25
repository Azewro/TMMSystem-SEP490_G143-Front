import apiClient from './apiConfig';

export const qcService = {
  getStageInspections: async (stageId) => {
    const response = await apiClient.get(`/v1/qc/stages/${stageId}/inspections`);
    return response.data;
  }
};

