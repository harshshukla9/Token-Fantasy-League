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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Transaction History</h3>
        <button
          onClick={() => refetchTransactions()}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
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
        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map((tx) => {
              // Handle timestamp - it might be a Date object or string
              const timestamp = tx.timestamp instanceof Date 
                ? tx.timestamp 
                : typeof tx.timestamp === 'string' 
                  ? new Date(tx.timestamp) 
                  : new Date();
              
              return (
                <div
                  key={tx.txHash || `${tx.address}-${tx.amount}-${timestamp.getTime()}`}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        +{parseFloat(formatEther(BigInt(tx.amount))).toFixed(4)} MNT
                      </p>
                      <p className="text-xs text-gray-500">
                        {timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://sepolia.mantlescan.xyz/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View →
                  </a>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No transactions yet</p>
              <p className="text-sm text-gray-500 mt-1">Your deposits will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

