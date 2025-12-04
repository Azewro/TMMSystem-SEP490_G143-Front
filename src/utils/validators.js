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

/**
 * Handler for onKeyPress event to only allow numeric input (including decimal point for decimal numbers)
 * @param {Event} e The keyboard event
 * @param {boolean} allowDecimal Whether to allow decimal point (default: false for integers)
 */
export const handleNumericKeyPress = (e, allowDecimal = false) => {
  // Allow: backspace, delete, tab, escape, enter, and decimal point (if allowed)
  if (
    [8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (e.keyCode === 65 && e.ctrlKey === true) ||
    (e.keyCode === 67 && e.ctrlKey === true) ||
    (e.keyCode === 86 && e.ctrlKey === true) ||
    (e.keyCode === 88 && e.ctrlKey === true) ||
    // Allow: home, end, left, right, down, up
    (e.keyCode >= 35 && e.keyCode <= 40)
  ) {
    return;
  }
  // Ensure that it is a number and stop the keypress
  if (
    ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) ||
    (allowDecimal && e.keyCode === 190 && e.target.value.includes('.'))
  ) {
    e.preventDefault();
  }
};

/**
 * Handler for onKeyPress event to only allow integer input (no decimal point)
 * @param {Event} e The keyboard event
 */
export const handleIntegerKeyPress = (e) => {
  handleNumericKeyPress(e, false);
};

/**
 * Handler for onKeyPress event to allow decimal numbers
 * @param {Event} e The keyboard event
 */
export const handleDecimalKeyPress = (e) => {
  handleNumericKeyPress(e, true);
};

/**
 * Handler for onInput event to sanitize numeric input (remove non-numeric characters)
 * @param {Event} e The input event
 * @param {boolean} allowDecimal Whether to allow decimal point (default: false for integers)
 * @returns {string} The sanitized value
 */
export const sanitizeNumericInput = (value, allowDecimal = false) => {
  if (allowDecimal) {
    // Allow numbers and one decimal point
    return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  } else {
    // Allow only integers
    return value.replace(/[^0-9]/g, '');
  }
};

/**
 * Parses a date string in YYYY-MM-DD format to a Date object using local timezone.
 * This avoids timezone issues when converting date strings to Date objects.
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} - Date object in local timezone, or null if invalid
 */
export const parseDateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  // Match YYYY-MM-DD format
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return null;
  }
  
  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
  const day = parseInt(dateMatch[3], 10);
  
  // Create date in local timezone (not UTC)
  const date = new Date(year, month, day);
  
  // Validate the date is valid (handles invalid dates like 2024-02-30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  
  return date;
};

/**
 * Formats a Date object to YYYY-MM-DD string format for backend/state compatibility.
 * Uses local date components to avoid timezone issues.
 * @param {Date} date - Date object to format
 * @returns {string} - Date string in YYYY-MM-DD format, or empty string if invalid
 */
export const formatDateForBackend = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  // Use local date components to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};