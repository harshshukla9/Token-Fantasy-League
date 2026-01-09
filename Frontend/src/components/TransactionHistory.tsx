'use client';

import React from 'react';
import { formatEther } from 'viem';
import { useBalance, Transaction } from '@/hooks/useBalance';
import { useAccount } from 'wagmi';
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';

export function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const { transactions, loading, refetchTransactions } = useBalance();

  if (!isConnected) {
    return null;
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-400" />;
      case 'confirmed':
      default:
        return <CheckCircle className="w-3 h-3 text-green-400" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'confirmed':
      default:
        return 'Confirmed';
    }
  };

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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction</th>
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
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-32"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-700 rounded w-40"></div>
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
          <p className="text-sm text-gray-500 mt-1">Your deposits and withdrawals will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: Transaction) => {
                // Handle timestamp - it might be a Date object or string
                const timestamp = tx.timestamp instanceof Date 
                  ? tx.timestamp 
                  : typeof tx.timestamp === 'string' 
                    ? new Date(tx.timestamp) 
                    : new Date();
                
                const isWithdraw = tx.type === 'withdraw';
                
                return (
                  <tr 
                    key={tx.txHash || `${tx.address}-${tx.amount}-${timestamp.getTime()}`}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isWithdraw ? 'bg-red-500/20' : 'bg-green-500/20'
                        }`}>
                          {isWithdraw ? (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <span className="text-sm text-white font-medium">
                          {isWithdraw ? 'Withdraw' : 'Deposit'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-semibold ${
                        isWithdraw ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {isWithdraw ? '-' : '+'}{parseFloat(formatEther(BigInt(tx.amount))).toFixed(4)} MNT
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(tx.status)}
                        <span className={`text-xs font-medium ${
                          tx.status === 'pending' ? 'text-yellow-400' : 
                          tx.status === 'failed' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-400">
                        {timestamp.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tx.txHash ? (
                        <a
                          href={`https://sepolia.mantlescan.xyz/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm font-mono transition-colors cursor-pointer"
                        >
                          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)} →
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
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

