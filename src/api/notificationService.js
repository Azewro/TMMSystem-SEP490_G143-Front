import apiClient from './apiConfig';

const mapApiError = (error, fallbackMessage) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.statusText) {
    return `${fallbackMessage}: ${error.response.statusText}`;
  }
  return fallbackMessage;
};

export const notificationService = {
  /**
   * Lấy danh sách notification của user
   */
  getNotifications: async (userId) => {
    try {
      const response = await apiClient.get(`/v1/system/notifications/user/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải danh sách thông báo'));
    }
  },

  /**
   * Lấy chi tiết notification
   */
  getNotification: async (notificationId) => {
    try {
      const response = await apiClient.get(`/v1/system/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi tải chi tiết thông báo'));
    }
  },

  /**
   * Đánh dấu notification là đã đọc
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/v1/system/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi đánh dấu thông báo đã đọc'));
    }
  },

  /**
   * Đánh dấu tất cả notification là đã đọc
   */
  markAllAsRead: async (userId) => {
    try {
      await apiClient.put(`/v1/system/notifications/user/${userId}/read-all`);
      return true;
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi đánh dấu tất cả thông báo đã đọc'));
    }
  },

  /**
   * Xóa notification
   */
  deleteNotification: async (notificationId) => {
    try {
      await apiClient.delete(`/v1/system/notifications/${notificationId}`);
    } catch (error) {
      throw new Error(mapApiError(error, 'Lỗi khi xóa thông báo'));
    }
  },

  /**
   * Đếm số notification chưa đọc
   */
  getUnreadCount: async (userId) => {
    try {
      const response = await apiClient.get(`/v1/system/notifications/user/${userId}/unread-count`);
      return response.data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
};

