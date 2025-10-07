import axios from "axios";
import { use } from "react";

const API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/api/admin";
const API_BASE = "https://tmmsystem-sep490g143-production.up.railway.app/v1/admin";
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data; 
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to fetch users");
    } else {
      throw new Error("Network error");
    }
  }
};
export const CreateUsers = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`,userData);
    return response.data; 
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Create failed ");
    } else {
      throw new Error("Network error");
    }
  }
};
export const UpdateUsers = async (id, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/${id}`,userData);
    return response.data; 
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Update failed ");
    } else {
      throw new Error("Network error");
    }
    }
};
export const toggleUserActive = async (id, value) => {
  const response = await axios.patch(`${API_BASE}/users/${id}/active?value=${value}`);
  return response.data;
};
export const getUserByID = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
    } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to fetch user");
    } else {
      throw new Error("Network error");
    }
    }
};
