import axios from "axios";

const API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

export const getAllMachines = async () => {
  try {
    const response = await axios.get(`${API_URL}/machines`);
    return response.data; 
  } catch (error) {
    console.error("Lỗi khi lấy danh sách máy:", error);
    throw error.response?.data || { message: "Không thể lấy danh sách máy" };
  }
};
