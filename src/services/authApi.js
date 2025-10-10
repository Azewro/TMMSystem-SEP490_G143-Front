import axios from "axios";

const API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1/auth";
const API_URL_ = "https://tmmsystem-sep490g143-production.up.railway.app/v1/auth/customer";
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data; 
  } catch (error) {   
    if (error.response) {
      throw new Error(error.response.data.message || "Login failed");
    } else {
      throw new Error("Network error");
    }
  }
};
export const changePassword = async (email, currentPassword, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/change-password`, {
      email,
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Change password failed");
    } else {
      throw new Error("Network error");
    }
  }
};
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi gửi email");
  }
};
export const verifyResetCode = async (email, code) => {
  try {
    const response = await axios.post(`${API_URL}/verify-reset-code`, { email, code });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Mã không hợp lệ");
  }
};
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL_}/register`, userData);
    return response.data; 
  } catch (error) {
    throw error.response?.data || { message: "Đăng ký thất bại" };
  }
};


