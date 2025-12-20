'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ACTION_TYPES, ACTION_WEIGHTS, ACTION_LABELS } from '@/shared';

type ActionTypeValue = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

const REPUTATION_ACTIONS_ABI = [
  {
    name: 'performAction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'actionType', type: 'uint8' },
      { name: 'target', type: 'address' }
    ],
    outputs: []
  }
] as const;

export function ActionPanel() {
  const { address, isConnected } = useAccount();
  const [selectedAction, setSelectedAction] = useState<ActionTypeValue>(ACTION_TYPES.FOLLOW);
  const [targetAddress, setTargetAddress] = useState('');
  const [error, setError] = useState('');

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const actionsAddress = process.env.NEXT_PUBLIC_REPUTATION_ACTIONS_ADDRESS as `0x${string}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!targetAddress || !targetAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address');
      return;
    }

    if (targetAddress.toLowerCase() === address?.toLowerCase()) {
      setError('Cannot perform action on yourself');
      return;
    }

    try {
      writeContract({
        address: actionsAddress,
        abi: REPUTATION_ACTIONS_ABI,
        functionName: 'performAction',
        args: [selectedAction, targetAddress as `0x${string}`],
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-warm-white mb-4">Perform Reputation Action</h2>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Connect your wallet to perform actions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-warm-white mb-4">Perform Reputation Action</h2>

      {/* Success Message */}
      {isSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="text-green-400 font-semibold">✅ Action submitted successfully!</p>
          <p className="text-sm text-gray-300 mt-1">
            Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Action Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Action Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(Number(e.target.value) as ActionTypeValue)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-warm-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
            disabled={isPending || isConfirming}
          >
            {Object.entries(ACTION_TYPES).map(([key, value]) => {
              const weight = (ACTION_WEIGHTS as any)[value];
              const label = ACTION_LABELS[value];
              return (
                <option key={value} value={value}>
                  {label} ({weight > 0 ? '+' : ''}{weight} points)
                </option>
              );
            })}
          </select>
        </div>

        {/* Target Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-warm-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
            disabled={isPending || isConfirming}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the Ethereum address of the user you want to interact with
          </p>
        </div>

        {/* Action Description */}
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-[#00E5FF]">
              {ACTION_LABELS[selectedAction as unknown as keyof typeof ACTION_LABELS]}
            </span>
            {' '}will {(ACTION_WEIGHTS as any)[selectedAction] > 0 ? 'increase' : 'decrease'} the target&apos;s reputation by{' '}
            <span className={(ACTION_WEIGHTS as any)[selectedAction] > 0 ? 'text-green-400' : 'text-red-400'}>
              {Math.abs((ACTION_WEIGHTS as any)[selectedAction])} points
            </span>
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isConfirming || !targetAddress}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#1DE9B6] hover:from-[#00B8D4] hover:to-[#00BFA5] text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && 'Preparing Transaction...'}
          {isConfirming && 'Confirming on Monad...'}
          {!isPending && !isConfirming && 'Submit Action'}
        </button>
      </form>

      {/* Transaction Status */}
      {(isPending || isConfirming) && (
        <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <p className="text-blue-400">
              {isPending && 'Waiting for wallet confirmation...'}
              {isConfirming && 'Transaction confirming on Monad Testnet...'}
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 How it works:</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Each action updates the target user&apos;s reputation score</li>
          <li>• Positive actions (Follow, Like, etc.) increase reputation</li>
          <li>• Negative actions (Report) decrease reputation</li>
          <li>• All actions are recorded on Monad blockchain</li>
          <li>• Leaderboard updates in real-time via WebSocket</li>
        </ul>
      </div>
    </div>
  );
}
