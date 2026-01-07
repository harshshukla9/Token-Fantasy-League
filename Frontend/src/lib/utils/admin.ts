/**
 * Admin utilities
 * Check if an address is an admin
 */

// Admin addresses - should be moved to environment variables in production
const ADMIN_ADDRESSES = (process.env.ADMIN_ADDRESSES || '0x58369AAED363a59022c98CD457Ea5e320Df395EB')
  .split(',')
  .map((addr) => addr.toLowerCase().trim())
  .filter((addr) => addr.length > 0);

export function isAdmin(address: string | undefined | null): boolean {
  if (!address) return false;
  return ADMIN_ADDRESSES.includes(address.toLowerCase());
}

export function requireAdmin(address: string | undefined | null): void {
  if (!isAdmin(address)) {
    throw new Error('Unauthorized: Admin access required');
  }
}

