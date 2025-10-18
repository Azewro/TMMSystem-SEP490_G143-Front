import axios from "axios";

const API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1/product-categories";

export const getAllCategories = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data; 
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    throw error;
  }
};