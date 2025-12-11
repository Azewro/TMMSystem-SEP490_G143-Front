import apiClient from './apiConfig';

/**
 * Dashboard API service for Director and Production Manager
 */
export const dashboardService = {
    /**
     * Get Director dashboard data
     * @returns {Promise} Dashboard data including pending approvals, metrics, charts
     */
    getDirectorDashboard: async () => {
        const response = await apiClient.get('/api/dashboard/director');
        return response.data;
    },

    /**
     * Get Production Manager dashboard data
     * @returns {Promise} Dashboard data including alerts, stages, machines, QC
     */
    getPMDashboard: async () => {
        const response = await apiClient.get('/api/dashboard/production-manager');
        return response.data;
    }
};

export default dashboardService;
