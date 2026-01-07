'use client';

import { formatEther } from 'viem';
import { useBalance } from '@/hooks/useBalance';
import { useAccount } from 'wagmi';

export function BalanceCard() {
  const { address, isConnected } = useAccount();
  const { balance, loading, error, refetch } = useBalance();

  if (!isConnected) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400">Connect your wallet to view balance</p>
        </div>
      </div>
    );
  }

  if (loading && !balance) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const balanceInEth = balance?.balance ? formatEther(BigInt(balance.balance)) : '0';

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="mb-4">
        <p className="text-gray-400 text-sm font-medium">Your Deposit Balance</p>
        <p className="text-xs text-gray-500 mt-1">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
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

