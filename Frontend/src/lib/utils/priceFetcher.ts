/**
 * Centralized price fetching utility with retry logic and error handling
 * This module provides robust price fetching from Binance API with fallbacks
 */

import { roundPriceToPrecision } from './pricePrecision';

// Map crypto IDs to Binance symbols
export const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  btc: 'BTCUSDT',
  eth: 'ETHUSDT',
  bnb: 'BNBUSDT',
  sol: 'SOLUSDT',
  ada: 'ADAUSDT',
  xrp: 'XRPUSDT',
  dot: 'DOTUSDT',
  matic: 'MATICUSDT',
  avax: 'AVAXUSDT',
  link: 'LINKUSDT',
  ltc: 'LTCUSDT',
  atom: 'ATOMUSDT',
  algo: 'ALGOUSDT',
  vet: 'VETUSDT',
  icp: 'ICPUSDT',
};

export interface PriceData {
  cryptoId: string;
  price: number;
  timestamp: Date;
}

interface FetchOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Fetch price for a single crypto with retry logic
 */
async function fetchSinglePriceWithRetry(
  cryptoId: string,
  binanceSymbol: string,
  options: FetchOptions = {}
): Promise<number | null> {
  const { retries = 3, retryDelay = 1000, timeout = 5000 } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const price = roundPriceToPrecision(data.price);

      return price;
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      
      if (isLastAttempt) {
        console.error(
          `Failed to fetch price for ${cryptoId} (${binanceSymbol}) after ${retries} attempts:`,
          error
        );
        return null;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  return null;
}

/**
 * Fetch prices for multiple cryptos with batch retry logic
 */
export async function fetchCryptoPrices(
  cryptoIds: string[],
  options: FetchOptions = {}
): Promise<PriceData[]> {
  const uniqueCryptoIds = Array.from(new Set(cryptoIds));
  const prices: PriceData[] = [];
  const timestamp = new Date();

  // Try fetching in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < uniqueCryptoIds.length; i += batchSize) {
    const batch = uniqueCryptoIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (cryptoId) => {
      const binanceSymbol = CRYPTO_SYMBOL_MAP[cryptoId];
      if (!binanceSymbol) {
        console.warn(`No Binance symbol mapping found for ${cryptoId}`);
        return null;
      }

      const price = await fetchSinglePriceWithRetry(cryptoId, binanceSymbol, options);
      
      if (price === null) {
        return null;
      }

      return {
        cryptoId,
        price,
        timestamp,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach((result) => {
      if (result) {
        prices.push(result);
      }
    });

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < uniqueCryptoIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return prices;
}

/**
 * Fetch prices for multiple cryptos in parallel (legacy method, less safe)
 */
export async function fetchCryptoPricesParallel(
  cryptoIds: string[],
  options: FetchOptions = {}
): Promise<PriceData[]> {
  const uniqueCryptoIds = Array.from(new Set(cryptoIds));
  const timestamp = new Date();

  const pricePromises = uniqueCryptoIds.map(async (cryptoId) => {
    const binanceSymbol = CRYPTO_SYMBOL_MAP[cryptoId];
    if (!binanceSymbol) {
      console.warn(`No Binance symbol mapping found for ${cryptoId}`);
      return null;
    }

    const price = await fetchSinglePriceWithRetry(cryptoId, binanceSymbol, options);
    
    if (price === null) {
      return null;
    }

    return {
      cryptoId,
      price,
      timestamp,
    };
  });

  const results = await Promise.all(pricePromises);
  
  return results.filter((result): result is PriceData => result !== null);
}

/**
 * Validate that we have prices for all required cryptos
 */
export function validatePrices(
  requiredCryptoIds: string[],
  fetchedPrices: PriceData[]
): { valid: boolean; missing: string[] } {
  const fetchedIds = new Set(fetchedPrices.map((p) => p.cryptoId));
  const missing = requiredCryptoIds.filter((id) => !fetchedIds.has(id));

  return {
    valid: missing.length === 0,
    missing,
  };
}
