'use client';

import React from 'react';
import { BalanceCard } from '@/components/BalanceCard';
import { DepositCard } from '@/components/DepositCard';
import { TransactionHistory } from '@/components/TransactionHistory';
import { SyncDepositsButton } from '@/components/SyncDepositsButton';
import { useBalance } from '@/hooks/useBalance';
import { useAccount } from 'wagmi';

export default function WalletPage() {
  const { isConnected } = useAccount();
  const { refetch, refetchTransactions } = useBalance();
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDepositSuccess = React.useCallback(() => {
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Debounce the refresh to prevent multiple calls
    refreshTimeoutRef.current = setTimeout(() => {
      refetch();
      refetchTransactions();
    }, 3000); // Wait 3 seconds for event to be processed
  }, [refetch, refetchTransactions]);

  const handleSyncComplete = React.useCallback(() => {
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Immediate refresh after sync
    setTimeout(() => {
      refetch();
      refetchTransactions();
    }, 500);
  }, [refetch, refetchTransactions]);

  React.useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Wallet & Deposits</h1>
          <p className="text-gray-400">
            Manage your deposits and view your balance stored on-chain
          </p>
        </div>

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
              <svg className="w-20 h-20 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Please connect your wallet to access deposit features and view your balance
              </p>
              <div className="text-sm text-gray-500">
                Click the "Connect Wallet" button in the navigation bar
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sync Button */}
            <div className="mb-6">
              <SyncDepositsButton onSyncComplete={handleSyncComplete} />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left Column - Balance */}
              <div>
                <BalanceCard />
              </div>

              {/* Right Column - Deposit */}
              <div>
                <DepositCard onDepositSuccess={handleDepositSuccess} />
              </div>
            </div>

            {/* Transaction History */}
            <div className="mb-8">
              <TransactionHistory />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold">Instant Updates</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Your balance updates automatically when deposits are confirmed on-chain
                </p>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold">Secure Storage</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Funds are stored in a verified smart contract on Mantle Sepolia
                </p>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold">Transparent</h3>
                </div>
                <p className="text-sm text-gray-400">
                  All transactions are verifiable on the blockchain explorer
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

