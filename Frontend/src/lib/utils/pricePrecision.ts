/**
 * Utility functions for maintaining price precision in database
 * Crypto prices are stored with up to 8 decimal places for precision
 */

/**
 * Round price to 8 decimal places to maintain precision
 * This prevents floating point precision issues while keeping enough decimals for crypto prices
 * @param price - The price value (number or string)
 * @returns Rounded price to 8 decimal places
 */
export function roundPriceToPrecision(price: number | string): number {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 0;
  // Round to 8 decimal places (100000000 = 10^8)
  return Math.round(numPrice * 100000000) / 100000000;
}

/**
 * Format price for display (2 decimal places)
 * @param price - The price value
 * @returns Formatted price string
 */
export function formatPriceForDisplay(price: number): string {
  return price.toFixed(2);
}

/**
 * Format price for display with custom decimal places
 * @param price - The price value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals);
}

