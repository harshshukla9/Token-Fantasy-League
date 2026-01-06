import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';

interface BalanceData {
  address: string;
  balance: string;
  lastUpdated: Date | null;
}

interface Transaction {
  address: string;
  amount: string;
  txHash: string;
  blockNumber: bigint;
  timestamp: Date;
  createdAt: Date;
}

export function useBalance() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache to prevent unnecessary refetches
  const lastFetchedAddress = useRef<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBalance = useCallback(async (userAddress?: string) => {
    const addressToFetch = userAddress || address;
    if (!addressToFetch) return;

    // Prevent duplicate fetches for same address
    if (lastFetchedAddress.current === addressToFetch.toLowerCase() && balance) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/balance/${addressToFetch}`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      
      const data = await response.json();
      setBalance(data);
      lastFetchedAddress.current = addressToFetch.toLowerCase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [address, balance]);

  const fetchTransactions = useCallback(async (userAddress?: string, limit = 50) => {
    const addressToFetch = userAddress || address;
    if (!addressToFetch) return;

    try {
      const response = await fetch(`/api/transactions/${addressToFetch}?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    }
  }, [address]);

  // Debounced initial fetch - only fetch once when address changes
  useEffect(() => {
    if (address) {
      // Clear any pending fetches
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Debounce the fetch to prevent rapid calls
      fetchTimeoutRef.current = setTimeout(() => {
        // Only fetch if address changed
        if (lastFetchedAddress.current !== address.toLowerCase()) {
          fetchBalance();
          fetchTransactions();
        }
      }, 100);
    } else {
      // Clear state when disconnected
      setBalance(null);
      setTransactions([]);
      lastFetchedAddress.current = null;
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [address]); // Only depend on address

  // Manual refetch functions (for button clicks)
  const refetch = useCallback(() => {
    if (address) {
      lastFetchedAddress.current = null; // Reset cache to force fetch
      fetchBalance();
    }
  }, [address, fetchBalance]);

  const refetchTransactions = useCallback(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, fetchTransactions]);

  return {
    balance,
    transactions,
    loading,
    error,
    refetch,
    refetchTransactions,
  };
}

