import apiClient from './apiConfig';

export const contractService = {
  getAll: async () => {
    const response = await apiClient.get('/v1/contracts');
    return response.data;
  },

  getById: async (contractId) => {
    const response = await apiClient.get(`/v1/contracts/${contractId}`);
    return response.data;
  },

  getOrderDetails: async (contractId) => {
    const response = await apiClient.get(`/v1/contracts/${contractId}/order-details`);
    return response.data;
  },

  getPendingForDirector: async () => {
    const response = await apiClient.get('/v1/contracts/director/pending');
    return response.data;
  },

  uploadSignedContract: async (contractId, file, { notes, saleUserId }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('notes', notes);
    }
    formData.append('saleUserId', saleUserId);

    const response = await apiClient.post(`/v1/contracts/${contractId}/upload-signed`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  },

  reUploadSignedContract: async (contractId, file, { notes, saleUserId }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('notes', notes);
    }
    formData.append('saleUserId', saleUserId);

    const response = await apiClient.post(`/v1/contracts/${contractId}/re-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  },

  approveContract: async (contractId, directorId, notes) => {
    const params = new URLSearchParams();
    params.append('directorId', directorId);
    if (notes) {
      params.append('notes', notes);
    }

    const response = await apiClient.post(`/v1/contracts/${contractId}/approve?${params.toString()}`);
    return response.data;
  },

  rejectContract: async (contractId, directorId, reason) => {
    const params = new URLSearchParams();
    params.append('directorId', directorId);
    params.append('rejectionNotes', reason);

    const response = await apiClient.post(`/v1/contracts/${contractId}/reject?${params.toString()}`);
    return response.data;
  },

  getContractFileUrl: async (contractId) => {
    const response = await apiClient.get(`/v1/contracts/${contractId}/file-url`);
    return response.data;
  },

  downloadContract: async (contractId) => {
    const response = await apiClient.get(`/v1/contracts/${contractId}/download`, {
      responseType: 'blob'
    });

    return response.data;
  }
};