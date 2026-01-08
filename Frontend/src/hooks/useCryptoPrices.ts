import { useState, useEffect, useCallback, useRef } from 'react';

export interface CryptoPrice {
  symbol: string;
  price: string;
  priceNumber: number; // Parsed price as number
}

interface UseCryptoPricesOptions {
  symbols: string[]; // e.g., ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
  interval?: number; // Polling interval in milliseconds (default: 5000)
  enabled?: boolean; // Whether to start polling (default: true)
}

export function useCryptoPrices({
  symbols,
  interval = 5000,
  enabled = true,
}: UseCryptoPricesOptions) {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!enabled || symbols.length === 0) return;

    try {
      setError(null);
      
      // Fetch all prices in parallel
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ${symbol}: ${response.statusText}`);
          }

          const data = await response.json();
          return {
            symbol: data.symbol,
            price: data.price,
            priceNumber: parseFloat(data.price),
          } as CryptoPrice;
        } catch (err) {
          console.error(`Error fetching price for ${symbol}:`, err);
          // Return previous price if available, or null
          return prices[symbol] || null;
        }
      });

      const results = await Promise.all(pricePromises);
      
      // Build price map, filtering out nulls
      const priceMap: Record<string, CryptoPrice> = {};
      results.forEach((price) => {
        if (price) {
          priceMap[price.symbol] = price;
        }
      });

      setPrices((prev) => ({ ...prev, ...priceMap }));
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(errorMessage);
      setLoading(false);
      console.error('Error fetching crypto prices:', err);
    }
  }, [symbols, enabled, prices]);

  // Initial fetch
  useEffect(() => {
    if (enabled && symbols.length > 0) {
      fetchPrices();
    }
  }, [enabled, symbols.join(',')]); // Only refetch if symbols change

  // Set up polling interval
  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      fetchPrices();
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, fetchPrices, symbols.join(',')]);

  // Get price for a specific symbol
  const getPrice = useCallback(
    (symbol: string): CryptoPrice | null => {
      return prices[symbol] || null;
    },
    [prices]
  );

  // Get price number for a specific symbol
  const getPriceNumber = useCallback(
    (symbol: string): number | null => {
      return prices[symbol]?.priceNumber || null;
    },
    [prices]
  );

  return {
    prices,
    loading,
    error,
    getPrice,
    getPriceNumber,
    refetch: fetchPrices,
  };
}

