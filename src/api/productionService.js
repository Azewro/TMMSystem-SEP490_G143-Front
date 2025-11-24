import apiClient from './apiConfig';

export const productionService = {
    getLeaderOrderDetail: async (orderId, leaderUserId) => {
        const response = await apiClient.get(`/v1/production/leader/orders/${orderId}`, {
            params: { leaderUserId }
        });
        return response.data;
    },

    getLeaderOrders: async (leaderUserId) => {
        const response = await apiClient.get('/v1/production/leader/orders', {
            params: { leaderUserId }
        });
        return response.data;
    },

    getStage: async (stageId) => {
        const response = await apiClient.get(`/v1/production/stages/${stageId}`);
        return response.data;
    },

    getQaOrders: async (qcUserId) => {
        const response = await apiClient.get('/v1/production/qa/orders', {
            params: { qcUserId }
        });
        return response.data;
    },

    getManagerOrders: async () => {
        const response = await apiClient.get('/v1/production/manager/orders');
        return response.data;
    },

    startWorkOrder: async (orderId) => {
        const response = await apiClient.post(`/v1/production/orders/${orderId}/start-work-order`);
        return response.data;
    },

    // Leader Defect APIs
    getLeaderDefects: async (leaderUserId) => {
        const response = await apiClient.get('/v1/production/leader/defects', {
            params: { leaderUserId }
        });
        return response.data;
    },

    getDefectDetail: async (defectId) => {
        const response = await apiClient.get(`/v1/production/defects/${defectId}`);
        return response.data;
    },

    startReworkFromDefect: async (defectId, userId) => {
        const response = await apiClient.post(`/v1/production/defects/${defectId}/start-rework`, null, {
            params: { userId }
        });
        return response.data;
    }
};
