'use client';

import { formatEther } from 'viem';
import { useBalance } from '@/hooks/useBalance';
import { useAccount } from 'wagmi';

export function BalanceCard() {
  const { address, isConnected } = useAccount();
  const { balance, loading, error, refetch } = useBalance();

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400">Connect your wallet to view balance</p>
        </div>
      </div>
    );
  }

  if (loading && !balance) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const balanceInEth = balance?.balance ? formatEther(BigInt(balance.balance)) : '0';

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium">Your Deposit Balance</p>
          <p className="text-xs text-gray-500 mt-1">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <button
          onClick={() => {
            // Only refetch on manual click, not auto
            refetch();
          }}
          className="text-gray-400 hover:text-white transition-colors"
          title="Refresh balance"
          disabled={loading}
        >
          <svg 
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-white">{parseFloat(balanceInEth).toFixed(4)}</span>
          <span className="ml-2 text-xl text-gray-400">MNT</span>
        </div>
        {balance?.lastUpdated && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(balance.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Stored in database • Real-time updates
        </p>
      </div>
    </div>
  );
}

