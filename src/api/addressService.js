const API_URL = 'https://provinces.open-api.vn/api/v2/';

const addressService = {
  async getProvinces() {
    try {
      const response = await fetch(`${API_URL}p/`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách tỉnh/thành phố.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  },

  async getDistricts(provinceCode) {
    if (!provinceCode) return [];
    try {
      // Speculative attempt with a different endpoint structure
      const response = await fetch(`${API_URL}d?province_code=${provinceCode}`);
      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }
      const data = await response.json();
      // Assuming this endpoint returns an array of districts directly
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Lỗi khi tải quận/huyện cho tỉnh ${provinceCode}:`, error);
      throw error;
    }
  },

  async getWards(districtCode) {
    if (!districtCode) return [];
    try {
      const response = await fetch(`${API_URL}d/${districtCode}?depth=2`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách phường/xã.');
      }
      const data = await response.json();
      return data.wards || [];
    } catch (error) {
      console.error(`Error fetching wards for district ${districtCode}:`, error);
      throw error;
    }
  },
};

export default addressService;
