const API_URL = 'https://provinces.open-api.vn/api/v2/'; // Direct API v2 URL

const addressService = {
  /**
   * Fetches the list of provinces from provinces.open-api.vn API v2.
   * @returns {Promise<Array>} A promise that resolves to an array of provinces.
   */
  async getProvinces() {
    try {
      const response = await fetch(`${API_URL}p/`);
      if (!response.ok) {
        throw new Error(`[getProvinces] API Error: ${response.status}`);
      }
      const data = await response.json();
      // API v2 returns an object with a 'value' property containing the array
      if (data && Array.isArray(data.value)) {
        return data.value;
      }
      // Fallback: if data is already an array (for backward compatibility)
      if (Array.isArray(data)) {
        return data;
      }
      console.error('Provinces API did not return a valid structure.', data);
      return [];
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  /**
   * Fetches the list of communes (wards) for a given province from provinces.open-api.vn API v2.
   * @param {string|number} provinceId The code of the province.
   * @returns {Promise<Array>} A promise that resolves to an array of communes/wards.
   */
  async getCommunes(provinceId) {
    if (!provinceId) {
      return [];
    }
    try {
      const response = await fetch(`${API_URL}p/${provinceId}?depth=2`);
      if (!response.ok) {
        throw new Error(`[getCommunes] API Error: ${response.status}`);
      }
      const data = await response.json();
      // API v2 returns a province object with a 'wards' array when depth=2
      if (data && Array.isArray(data.wards)) {
        return data.wards;
      }
      console.error('API for communes did not return a valid structure (missing wards array).', data);
      return [];
    } catch (error) {
      console.error(`Error fetching communes for province ${provinceId}:`, error);
      return [];
    }
  },
};

export default addressService;
