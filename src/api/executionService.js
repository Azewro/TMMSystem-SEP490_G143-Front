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
    },

    getStageTrackings: async (stageId) => {
        const response = await apiClient.get(`/v1/execution/stages/${stageId}/trackings`);
        return response.data;
    },

    uploadQcPhoto: async (file, stageId, qcUserId) => {
        const formData = new FormData();
        formData.append('file', file);
        if (stageId) {
            formData.append('stageId', stageId);
        }
        if (qcUserId) {
            formData.append('qcUserId', qcUserId);
        }
        const response = await apiClient.post('/api/files/qc/photos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getStageByToken: async (token) => {
        const response = await apiClient.get(`/v1/execution/stages/by-token/${token}`);
        return response.data;
    }
};
