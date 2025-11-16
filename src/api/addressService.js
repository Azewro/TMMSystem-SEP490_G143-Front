const API_URL = '/api-address/api/v2/'; // Using proxy for the old API v2

const addressService = {
  /**
   * Fetches the list of provinces from provinces.open-api.vn.
   * @returns {Promise<Array>} A promise that resolves to an array of provinces.
   */
  async getProvinces() {
    try {
      const response = await fetch(`${API_URL}p/`);
      if (!response.ok) {
        throw new Error(`[getProvinces] API Error: ${response.status}`);
      }
      const data = await response.json();
      // Assuming this API returns a direct array of provinces
      if (!Array.isArray(data)) {
        console.error('Provinces API did not return an array.');
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  /**
   * Fetches the list of communes (wards) for a given province from provinces.open-api.vn.
   * @param {string} provinceId The ID of the province.
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
      // This API returns a province object with a 'wards' array
      if (!data || !Array.isArray(data.wards)) {
        console.error('API for communes did not return a valid structure (missing wards array).');
        return [];
      }
      return data.wards;
    } catch (error) {
      console.error(`Error fetching communes for province ${provinceId}:`, error);
      return [];
    }
  },
};

export default addressService;
