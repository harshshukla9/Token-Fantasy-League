'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BalanceCard } from '@/components/BalanceCard';
import { DepositCard } from '@/components/DepositCard';
import { TransactionHistory } from '@/components/TransactionHistory';
import { SyncDepositsButton } from '@/components/SyncDepositsButton';
import { useBalance } from '@/hooks/useBalance';
import { Zap, Lock, Eye } from 'lucide-react';

export default function WalletPage() {
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

  const handleRefresh = React.useCallback(() => {
    // Refresh balance and transactions
    refetch();
    refetchTransactions();
  }, [refetch, refetchTransactions]);

  React.useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <ProtectedRoute>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Wallet & Deposits</h1>
            <p className="text-gray-400">
              Manage your deposits and view your balance stored on-chain
            </p>
          </div>

          {/* Sync Button */}
          <div className="mb-6">
            <SyncDepositsButton onSyncComplete={handleSyncComplete} onRefresh={handleRefresh} />
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
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold">Instant Updates</h3>
              </div>
              <p className="text-sm text-gray-400">
                Your balance updates automatically when deposits are confirmed on-chain
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold">Secure Storage</h3>
              </div>
              <p className="text-sm text-gray-400">
                Funds are stored in a verified smart contract on Mantle Sepolia
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold">Transparent</h3>
              </div>
              <p className="text-sm text-gray-400">
                All transactions are verifiable on the blockchain explorer
              </p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    </div>
  );
}

