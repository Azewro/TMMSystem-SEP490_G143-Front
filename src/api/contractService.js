import apiClient from './apiConfig';
import { API_BASE_URL } from '../utils/constants';

export const contractService = {
  getAllContracts: async () => {
    try {
      const response = await apiClient.get('/v1/contracts');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách hợp đồng');
    }
  },

  getContractsByAssignedSalesId: async (userId) => {
    try {
      const response = await apiClient.get(`/v1/contracts/assigned/sales/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách hợp đồng cho sales');
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('notes', notes);
    formData.append('saleUserId', saleUserId);

    const token = sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực.');
    }

    const url = `${API_BASE_URL}/v1/contracts/${contractId}/upload-signed`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Yêu cầu thất bại với status: ${response.status}` }));
        throw new Error(errorData.message || `Lỗi không xác định từ server`);
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi khi thực hiện fetch:", error);
      // Re-throw a more generic error to the UI component
      throw new Error('Lỗi khi upload hợp đồng. Vui lòng kiểm tra console để biết chi tiết.');
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
        params: { directorId, rejectionNotes: notes }
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
