import axios from "axios";
const API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";
export const getCustomerProfile = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/customer-users/${id}`);
    return response.data; 
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to fetch customer profile");
    } else {
      throw new Error("Network error");
    }
    }
};
