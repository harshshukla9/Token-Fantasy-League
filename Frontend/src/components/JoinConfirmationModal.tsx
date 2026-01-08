'use client';

import { formatEther } from 'viem';
import { ExternalLink } from 'lucide-react';

interface JoinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entryFee: string; // in wei
  lobbyName: string;
  loading?: boolean;
  depositing?: boolean;
  confirming?: boolean;
  transactionHash?: string;
  error?: string;
}

export function JoinConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  entryFee,
  lobbyName,
  loading = false,
  depositing = false,
  confirming = false,
  transactionHash,
  error,
}: JoinConfirmationModalProps) {
  if (!isOpen) return null;

  const feeInMNT = parseFloat(formatEther(BigInt(entryFee || '0'))).toFixed(2);
  const isProcessing = depositing || confirming || loading;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Entry</h2>
          <p className="text-gray-400 text-sm">
            You are about to join <span className="text-white font-semibold">{lobbyName}</span>
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Entry Fee:</span>
            <span className="text-2xl font-bold text-white">{feeInMNT} MNT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This amount will be deposited to the smart contract
          </p>
        </div>

        {transactionHash && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-400">Transaction:</span>
              <a
                href={`https://sepolia.mantlescan.xyz/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-300">
            <strong className="text-white">Fees {feeInMNT} MNT</strong> will be charged to enter this lobby
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300 text-black disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {depositing ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Depositing...
              </>
            ) : confirming ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Confirming...
              </>
            ) : loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Joining...
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

