const API_URL = 'https://provinces.open-api.vn/api/v2/';
const LOCAL_NESTED_DIVISIONS_URL = '/data/nested-divisions.json';
const LOCAL_FLAT_DIVISIONS_URL = '/data/flat-divisions.json';

// Cache for local data
let cachedNestedData = null;
let cachedFlatData = null;

/**
 * Loads local nested divisions data (provinces with wards nested inside)
 */
async function loadNestedData() {
  if (cachedNestedData) return cachedNestedData;

  try {
    const response = await fetch(LOCAL_NESTED_DIVISIONS_URL);
    if (!response.ok) throw new Error('Failed to load local nested data');
    cachedNestedData = await response.json();
    return cachedNestedData;
  } catch (error) {
    console.error('Error loading local nested data:', error);
    return [];
  }
}

/**
 * Loads local flat divisions data (all wards with province_name)
 */
async function loadFlatData() {
  if (cachedFlatData) return cachedFlatData;

  try {
    const response = await fetch(LOCAL_FLAT_DIVISIONS_URL);
    if (!response.ok) throw new Error('Failed to load local flat data');
    cachedFlatData = await response.json();
    return cachedFlatData;
  } catch (error) {
    console.error('Error loading local flat data:', error);
    return [];
  }
}

const addressService = {
  /**
   * Fetches the list of provinces from provinces.open-api.vn API v2.
   * Falls back to local JSON file if API is unavailable.
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
      throw new Error('Invalid API response structure');
    } catch (error) {
      console.warn('API failed, falling back to local data:', error.message);

      // Fallback to local nested-divisions.json
      const nestedData = await loadNestedData();
      if (Array.isArray(nestedData)) {
        // Extract provinces from nested data
        return nestedData.map(province => ({
          code: province.code,
          name: province.name,
          codename: province.codename,
          division_type: province.division_type,
          phone_code: province.phone_code
        }));
      }
      return [];
    }
  },

  /**
   * Fetches the list of communes (wards) for a given province from provinces.open-api.vn API v2.
   * Falls back to local JSON file if API is unavailable.
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
      throw new Error('Invalid API response structure');
    } catch (error) {
      console.warn(`API failed for province ${provinceId}, falling back to local data:`, error.message);

      // Fallback to local nested-divisions.json
      const nestedData = await loadNestedData();
      const province = nestedData.find(p => p.code === Number(provinceId));
      if (province && Array.isArray(province.wards)) {
        return province.wards;
      }
      return [];
    }
  },

  /**
   * Gets all wards with their province names from local flat data.
   * This is useful for searching or displaying ward information with province context.
   * @returns {Promise<Array>} A promise that resolves to an array of wards with province info.
   */
  async getAllWardsFlat() {
    return await loadFlatData();
  },

  /**
   * Gets all data from nested-divisions.json (provinces with nested wards).
   * @returns {Promise<Array>} A promise that resolves to the full nested data.
   */
  async getAllNestedData() {
    return await loadNestedData();
  }
};

export default addressService;
