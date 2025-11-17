/**
 * Validates a phone number against a comprehensive Vietnamese phone number regex.
 * This regex handles mobile and landline numbers, with or without country codes (+84, 84)
 * and optional separators ('.', '-').
 * @param {string} phoneNumber The phone number to validate.
 * @returns {boolean} True if the phone number is valid, false otherwise.
 */
export const isVietnamesePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return false;
  }
  // Regex provided by the team
  const phoneRegex = /^(?:\+84|84|0)(?:2\d{1,2}([-.]?)\d{7,8}|(?:3\d|5\d|7\d|8\d|9\d)([-.]?)\d{3}\2\d{4})$/;
  return phoneRegex.test(phoneNumber);
};
