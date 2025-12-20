/**
 * Format an Ethereum address for display
 */
export function formatAddress(address: string, length: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format a timestamp to relative time (e.g., "5 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format duration in seconds to human-readable string (e.g., "7 days", "24 hours")
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

/**
 * Format date to readable string (e.g., "Jan 15, 2024 10:30 AM")
 */
export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: Date | string | number, durationSeconds: number): Date {
  const start = typeof startTime === 'string' || typeof startTime === 'number' ? new Date(startTime) : startTime;
  return new Date(start.getTime() + durationSeconds * 1000);
}

/**
 * Simulate current price based on initial price and time elapsed
 * Uses time-based seed for consistent updates every 10 seconds
 * Uses random walk with slight trend based on initial 24h change
 */
export function simulateCurrentPrice(
  initialPrice: number,
  initialChange24h: number,
  joinedAt: string | Date,
  volatility: number = 0.05
): number {
  const joinTime = typeof joinedAt === 'string' ? new Date(joinedAt) : joinedAt;
  const now = Date.now();
  const timeElapsed = (now - joinTime.getTime()) / (1000 * 60 * 60); // Hours elapsed
  const daysElapsed = timeElapsed / 24;
  
  // Use time-based seed (updates every 10 seconds) for consistent price changes
  const timeSeed = Math.floor(now / 10000); // Changes every 10 seconds
  const cryptoSeed = initialPrice.toString().length + initialChange24h; // Unique per crypto
  
  // Create a pseudo-random number based on time seed and crypto properties
  const seededRandom = () => {
    const x = Math.sin(timeSeed * cryptoSeed + initialPrice) * 10000;
    return x - Math.floor(x);
  };
  
  // Base trend from initial 24h change (scaled to days)
  const trendFactor = (initialChange24h / 100) * daysElapsed;
  
  // Random walk with volatility using seeded random for consistency
  const randomWalk = (seededRandom() - 0.5) * 2 * volatility * Math.sqrt(Math.max(0.1, daysElapsed));
  
  // Add small periodic variation that changes every 10 seconds
  const periodicVariation = Math.sin(timeSeed * 0.1) * volatility * 0.5;
  
  // Calculate new price
  const priceChange = trendFactor + randomWalk + periodicVariation;
  const newPrice = initialPrice * (1 + priceChange);
  
  return Math.max(0.0001, newPrice); // Ensure price doesn't go negative
}

/**
 * Calculate points for a single cryptocurrency based on price performance
 */
export function calculateCryptoPoints(
  initialPrice: number,
  currentPrice: number,
  isCaptain: boolean = false,
  isViceCaptain: boolean = false
): number {
  // Calculate percentage change
  const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;
  
  // Base points: 100 points per 1% change (positive or negative)
  let points = priceChange * 100;
  
  // Apply multipliers
  if (isCaptain) {
    points *= 2; // Captain gets 2x points
  } else if (isViceCaptain) {
    points *= 1.5; // Vice-Captain gets 1.5x points
  }
  
  return Math.round(points);
}

/**
 * Calculate total team points based on all selected cryptocurrencies
 */
export function calculateTeamPoints(
  selectedCryptos: Array<{
    id: string;
    initialPrice: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }>,
  getCurrentPrice: (cryptoId: string) => number
): number {
  let totalPoints = 0;
  
  selectedCryptos.forEach((crypto) => {
    const currentPrice = getCurrentPrice(crypto.id);
    const cryptoPoints = calculateCryptoPoints(
      crypto.initialPrice,
      currentPrice,
      crypto.isCaptain,
      crypto.isViceCaptain
    );
    totalPoints += cryptoPoints;
  });
  
  return totalPoints;
}
