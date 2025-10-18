import axios from "axios";

const PRODUCT_API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1/products";

export const getAllProducts = async () => {
  try {
    const response = await axios.get(PRODUCT_API_URL);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    throw error;
  }
};