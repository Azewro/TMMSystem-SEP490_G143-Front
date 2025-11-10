import apiClient from './apiConfig';

export const contractService = {
  getAllContracts: async () => {
    try {
      const response = await apiClient.get('/v1/contracts');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách hợp đồng');
    }
  },

  createContract: async (contractData) => {
    try {
      const response = await apiClient.post('/v1/contracts', contractData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo hợp đồng');
    }
  },

  uploadSignedContract: async (contractId, file, notes, saleUserId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notes', notes);
      formData.append('saleUserId', saleUserId);

      const response = await apiClient.post(`/v1/contracts/${contractId}/upload-signed`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi upload hợp đồng');
    }
  },

  getDirectorPendingContracts: async () => {
    try {
      const response = await apiClient.get('/v1/contracts/director/pending');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách hợp đồng chờ duyệt');
    }
  },

  approveContract: async (contractId, directorId, notes) => {
    try {
      const response = await apiClient.post(`/v1/contracts/${contractId}/approve`, null, {
        params: { directorId, notes }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt hợp đồng');
    }
  },

  rejectContract: async (contractId, directorId, notes) => {
    try {
      const response = await apiClient.post(`/v1/contracts/${contractId}/reject`, null, {
        params: { directorId, notes }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi từ chối hợp đồng');
    }
  },

  getOrderDetails: async (contractId) => {
    try {
      const response = await apiClient.get(`/v1/contracts/${contractId}/order-details`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải chi tiết đơn hàng');
    }
  },

  getContractFileUrl: async (contractId) => {
    try {
      const response = await apiClient.get(`/v1/contracts/${contractId}/file-url`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy URL file hợp đồng');
    }
  }
};
