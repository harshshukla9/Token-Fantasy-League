'use client';

import React from 'react';
import { formatEther } from 'viem';
import { useBalance } from '@/hooks/useBalance';
import { useAccount } from 'wagmi';

export function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const { transactions, loading, refetchTransactions } = useBalance();

  // Debug logging
  React.useEffect(() => {
    if (transactions && transactions.length > 0) {
      console.log('📋 Transactions loaded:', transactions.length, transactions);
    }
  }, [transactions]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">Transaction History</h3>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gray-800 animate-pulse">
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-32"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-40"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No transactions yet</p>
          <p className="text-sm text-gray-500 mt-1">Your deposits will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                // Handle timestamp - it might be a Date object or string
                const timestamp = tx.timestamp instanceof Date 
                  ? tx.timestamp 
                  : typeof tx.timestamp === 'string' 
                    ? new Date(tx.timestamp) 
                    : new Date();
                
                return (
                  <tr 
                    key={tx.txHash || `${tx.address}-${tx.amount}-${timestamp.getTime()}`}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-sm text-white font-medium">Deposit</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-green-400">
                        +{parseFloat(formatEther(BigInt(tx.amount))).toFixed(4)} MNT
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-400">
                        {timestamp.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500 font-mono">
                        {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-8)}` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tx.txHash && (
                        <a
                          href={`https://sepolia.mantlescan.xyz/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors cursor-pointer"
                        >
                          View →
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

