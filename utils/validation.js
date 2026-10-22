/**
 * Input sanitization, validation helpers, and reference generator
 */

/**
 * Format a phone number into an international WhatsApp number format without symbols or spaces
 * Specifically handles Kenyan formats:
 *   "0712 345 678" -> "254712345678"
 *   "+254 712 345 678" -> "254712345678"
 *   "254712345678" -> "254712345678"
 * @param {string} phone 
 * @returns {string}
 */
function sanitizeWhatsAppNumber(phone) {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, plus signs
  let cleaned = String(phone).replace(/[^\d]/g, '');

  // Handle local Kenya prefixes: starting with '07' or '01'
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Basic check if phone number looks valid (at least 9 digits)
 * @param {string} phone 
 * @returns {boolean}
 */
function isValidWhatsAppNumber(phone) {
  const sanitized = sanitizeWhatsAppNumber(phone);
  return sanitized.length >= 9 && sanitized.length <= 15;
}

/**
 * Generate a unique, professional reference code
 * @param {string} prefix 'CUST', 'GIFT', 'ORD'
 * @returns {string} e.g. "YB-CUST-7294"
 */
function generateReferenceNumber(prefix = 'ORD') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString(36).slice(-3).toUpperCase();
  return `YB-${prefix}-${timestampPart}${random}`;
}

/**
 * Escape HTML special characters to prevent XSS in dynamic outputs
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  sanitizeWhatsAppNumber,
  isValidWhatsAppNumber,
  generateReferenceNumber,
  escapeHtml
};
