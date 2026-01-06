'use client';

import { formatEther } from 'viem';

interface JoinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entryFee: string; // in wei
  lobbyName: string;
  loading?: boolean;
}

export function JoinConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  entryFee,
  lobbyName,
  loading = false,
}: JoinConfirmationModalProps) {
  if (!isOpen) return null;

  const feeInMNT = parseFloat(formatEther(BigInt(entryFee || '0'))).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Entry</h2>
          <p className="text-gray-400 text-sm">
            You are about to join <span className="text-white font-semibold">{lobbyName}</span>
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Entry Fee:</span>
            <span className="text-2xl font-bold text-white">{feeInMNT} MNT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This amount will be deducted from your wallet balance
          </p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-200">
            <strong>Fees {feeInMNT} MNT</strong> will be charged to enter this lobby
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              'OK'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

