'use client';

import { useState, useCallback } from 'react';
import { formatEther, parseEther } from 'viem';
import { useBalance } from '@/hooks/useBalance';
import { useWithdraw, WithdrawStatus } from '@/hooks/useWithdraw';
import { useAccount } from 'wagmi';
import { LogOut, X, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

// Mantle Sepolia explorer
const EXPLORER_URL = 'https://sepolia.mantlescan.xyz';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxBalance: string;
  onWithdraw: (amount: string) => void;
  status: WithdrawStatus;
  error: string | null;
  txHash: string | null;
  onReset: () => void;
}

function WithdrawModal({ 
  isOpen, 
  onClose, 
  maxBalance, 
  onWithdraw, 
  status, 
  error, 
  txHash,
  onReset,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const maxBalanceNum = parseFloat(maxBalance);
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum > 0 && amountNum <= maxBalanceNum;
  const isProcessing = ['requesting', 'signing', 'confirming', 'recording'].includes(status);

  const handleSetMax = () => {
    setAmount(maxBalance);
  };

  const handleSubmit = () => {
    if (isValidAmount && !isProcessing) {
      onWithdraw(amount);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      onReset();
      onClose();
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'requesting':
        return 'Requesting withdrawal...';
      case 'signing':
        return 'Please sign the transaction in your wallet...';
      case 'confirming':
        return 'Waiting for confirmation...';
      case 'recording':
        return 'Recording transaction...';
      case 'success':
        return 'Withdrawal successful!';
      case 'error':
        return error || 'Withdrawal failed';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Withdrawal Successful!</h3>
            <p className="text-gray-400 mb-4">
              Your funds have been sent to your wallet.
            </p>
            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                View on Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleClose}
              className="w-full mt-6 bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Withdrawal Failed</h3>
            <p className="text-red-400 mb-4 text-sm">
              {error || 'An error occurred during withdrawal'}
            </p>
            <button
              onClick={() => {
                onReset();
                setAmount('');
              }}
              className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{getStatusMessage()}</h3>
            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                View Transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Input State */}
        {status === 'idle' && (
          <>
            {/* Balance Display */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-white">
                {parseFloat(maxBalance).toFixed(4)} <span className="text-gray-400 text-lg">MNT</span>
              </p>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Withdraw Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.0001"
                  min="0"
                  max={maxBalance}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleSetMax}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  MAX
                </button>
              </div>
              {amountNum > maxBalanceNum && (
                <p className="text-red-400 text-sm mt-2">
                  Amount exceeds available balance
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p className="mb-1">Withdrawal will be processed on-chain.</p>
                  <p>Gas fees will be deducted from your wallet balance.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isValidAmount}
              className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Withdraw {amount || '0'} MNT
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function BalanceCard() {
  const { address, isConnected } = useAccount();
  const { balance, loading, error: balanceError, refetch } = useBalance();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { withdraw, status, error, txHash, reset } = useWithdraw((result) => {
    // Refetch balance after successful withdrawal
    refetch();
  });

  const handleWithdraw = useCallback((amount: string) => {
    withdraw(amount);
  }, [withdraw]);

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
  const hasBalance = parseFloat(balanceInEth) > 0;

  return (
    <>
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

        {balanceError && (
          <div className="text-red-400 text-sm mb-4">
            {balanceError}
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!hasBalance}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Withdraw
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Stored in database • Real-time updates
          </p>
        </div>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        maxBalance={balanceInEth}
        onWithdraw={handleWithdraw}
        status={status}
        error={error}
        txHash={txHash}
        onReset={reset}
      />
    </>
  );
}
