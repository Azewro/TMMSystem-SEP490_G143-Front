import axios from "axios";

const RFQ_API_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1/rfqs";

export const createRFQ = async (rfqData, token) => {
  try {
    const response = await axios.post(RFQ_API_URL, rfqData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    return response.data;
    conslole.log("RFQ created successfully:", response.data);
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu báo giá:", error);
    throw error.response?.data || error;
  }
};
export const getAllRFQs = async () => {
  try {
    const response = await axios.get(RFQ_API_URL);
    return response.data; 
  } catch (error) {
    console.error("Lỗi khi lấy danh sách RFQ:", error);
    throw error;
  }
};
