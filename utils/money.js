/**
 * Money and Currency Utilities for Yarn & Bloom
 * Handles formatting, parsing, and rounding in Kenyan Shillings (KSh)
 */

const CURRENCY_PREFIX = 'KSh ';

/**
 * Format a number or numeric string as Kenyan Shillings
 * Example: 2500 -> "KSh 2,500"
 * @param {number|string} amount 
 * @param {boolean} showDecimals - Whether to show .00 (default false for clean craft display)
 * @returns {string}
 */
function formatKSh(amount, showDecimals = false) {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numeric) || numeric === null) {
    return `${CURRENCY_PREFIX}0`;
  }

  const options = {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  };

  return `${CURRENCY_PREFIX}${numeric.toLocaleString('en-KE', options)}`;
}

/**
 * Parse an input string or number into a clean float with 2 decimal places
 * @param {number|string} input 
 * @returns {number}
 */
function parseAmount(input) {
  if (typeof input === 'number') {
    return Math.round(input * 100) / 100;
  }
  if (!input) return 0;
  // Strip any currency prefixes, commas, and whitespace
  const sanitized = String(input).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Calculate percentage discount between regular price and compare-at price
 * @param {number} originalPrice 
 * @param {number} currentPrice 
 * @returns {number|null}
 */
function calculateDiscount(originalPrice, currentPrice) {
  const orig = parseAmount(originalPrice);
  const curr = parseAmount(currentPrice);
  if (orig <= curr || orig <= 0) return null;
  return Math.round(((orig - curr) / orig) * 100);
}

module.exports = {
  CURRENCY_PREFIX,
  formatKSh,
  parseAmount,
  calculateDiscount
};
