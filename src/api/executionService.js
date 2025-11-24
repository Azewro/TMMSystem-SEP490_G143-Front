import apiClient from './apiConfig';

export const executionService = {
    startStage: async (stageId, userId) => {
        const response = await apiClient.post(`/v1/execution/stages/${stageId}/start`, null, {
            params: { userId }
        });
        return response.data;
    },

    updateProgress: async (stageId, userId, percent) => {
        const response = await apiClient.put(`/v1/execution/stages/${stageId}/progress`, null, {
            params: { userId, percent }
        });
        return response.data;
    },

    startQcSession: async (stageId, qcUserId) => {
        const response = await apiClient.post(`/v1/execution/stages/${stageId}/qc/start`, null, {
            params: { qcUserId }
        });
        return response.data;
    },

    submitQcSession: async (sessionId, result, notes, qcUserId, defectLevel, defectDescription, criteriaResults) => {
        const response = await apiClient.post(`/v1/execution/qc-sessions/${sessionId}/submit`, criteriaResults, {
            params: { result, notes, qcUserId, defectLevel, defectDescription }
        });
        return response.data;
    },

    getStageCheckpoints: async (stageId) => {
        const response = await apiClient.get(`/v1/execution/stages/${stageId}/checkpoints`);
        return response.data;
    },

    leaderStages: async (leaderUserId) => {
        const response = await apiClient.get('/v1/execution/leader/stages', {
            params: { leaderUserId }
        });
        return response.data;
    },

    qcStages: async (qcUserId) => {
        const response = await apiClient.get('/v1/execution/qc/stages', {
            params: { qcUserId }
        });
        return response.data;
    }
};
