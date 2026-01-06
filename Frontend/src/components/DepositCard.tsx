'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { DepositABI } from '@/abis/Deposit';
import { CONTRACT_ADDRESSES } from '@/shared/constants';
import { useDepositEvents } from '@/hooks/useDepositEvents';

export function DepositCard({ onDepositSuccess }: { onDepositSuccess?: () => void }) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [savingToDB, setSavingToDB] = useState(false);

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

      console.log('💰 Deposit event detected, saving to database...', event);
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

        const data = await response.json();
        console.log('✅ Deposit saved to database:', data);

        // Refresh balance after saving
        setTimeout(() => {
          onDepositSuccess?.();
          setSavingToDB(false);
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to save deposit to database:', error);
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
      console.error('Deposit error:', err);
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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400">Connect your wallet to deposit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Deposit Funds</h3>
        <p className="text-sm text-gray-400">
          Deposit MNT to your account balance
        </p>
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              disabled={isPending || isConfirming || isSuccess}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => setAmount('1')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            >
              1 MNT
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
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg border border-red-800">
            {error.message}
          </div>
        )}

        {isSuccess && (
          <div className="text-green-400 text-sm p-3 bg-green-900/20 rounded-lg border border-green-800">
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

