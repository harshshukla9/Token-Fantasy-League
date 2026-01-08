'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { DepositABI } from '@/abis/Deposit';
import { CONTRACT_ADDRESSES } from '@/shared/constants';
import { useDepositEvents } from '@/hooks/useDepositEvents';

export function DepositCard({ onDepositSuccess }: { onDepositSuccess?: () => void }) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [savingToDB, setSavingToDB] = useState(false);

  // Get wallet balance
  const { data: walletBalance } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Listen for deposit events and save to database
  useDepositEvents({
    enabled: isConnected,
    onDeposit: async (event) => {
      // Only process if it's from the current user
      if (event.player.toLowerCase() !== address?.toLowerCase()) {
        return;
      }

      setSavingToDB(true);

      try {
        const response = await fetch('/api/deposits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: event.player,
            amount: event.amount.toString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber.toString(),
            timestamp: event.timestamp.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save deposit');
        }

        setTimeout(() => {
          onDepositSuccess?.();
          setSavingToDB(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to save deposit:', error);
        setSavingToDB(false);
      }
    },
  });

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsDepositing(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.DEPOSIT as `0x${string}`,
        abi: DepositABI,
        functionName: 'deposit',
        value: parseEther(amount),
      });
    } catch (err) {
      setIsDepositing(false);
    }
  };

  // Handle successful deposit
  if (isSuccess) {
    setTimeout(() => {
      setAmount('');
      setIsDepositing(false);
      onDepositSuccess?.();
    }, 2000);
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400">Connect your wallet to deposit</p>
        </div>
      </div>
    );
  }

  const walletBalanceFormatted = walletBalance ? formatEther(walletBalance.value) : '0';
  const handleMaxClick = () => {
    if (walletBalance) {
      setAmount(walletBalanceFormatted);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Deposit Funds</h3>
        <p className="text-sm text-gray-400">
          Deposit MNT to your account balance
        </p>
      </div>

      {/* Wallet Balance Display */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Wallet Balance:</span>
          <span className="text-sm font-semibold text-white">
            {parseFloat(walletBalanceFormatted).toFixed(4)} {walletBalance?.symbol || 'MNT'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (MNT)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0"
              max={walletBalanceFormatted}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              disabled={isPending || isConfirming || isSuccess}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleMaxClick}
              disabled={isPending || isConfirming || isSuccess || !walletBalance || parseFloat(walletBalanceFormatted) === 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded font-medium transition-colors cursor-pointer"
            >
              Max
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {['0.1', '0.5', '1', '5'].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              disabled={isPending || isConfirming || isSuccess}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <button
          onClick={handleDeposit}
          disabled={!amount || isPending || isConfirming || isSuccess}
          className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 disabled:to-gray-700 text-black disabled:text-gray-300 font-bold py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending && (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Confirm in Wallet...
            </>
          )}
          {isConfirming && (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Confirming...
            </>
          )}
          {isSuccess && (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Deposit Successful!
            </>
          )}
          {!isPending && !isConfirming && !isSuccess && 'Deposit'}
        </button>

        {hash && (
          <div className="text-xs text-gray-400 break-all">
            <span className="font-medium">Transaction:</span>{' '}
            <a
              href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </a>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm p-3 bg-gray-800 rounded-lg border border-red-800">
            {error.message}
          </div>
        )}

        {isSuccess && (
          <div className="text-green-400 text-sm p-3 bg-gray-800 rounded-lg border border-green-800">
            {savingToDB ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  Saving to database...
                </div>
              </>
            ) : (
              '✅ Deposit successful! Balance updated in database.'
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Contract: {CONTRACT_ADDRESSES.DEPOSIT.slice(0, 6)}...{CONTRACT_ADDRESSES.DEPOSIT.slice(-4)}
        </p>
      </div>
    </div>
  );
}

