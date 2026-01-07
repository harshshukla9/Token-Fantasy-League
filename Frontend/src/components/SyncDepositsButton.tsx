'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface SyncDepositsButtonProps {
  onSyncComplete?: () => void;
  onRefresh?: () => void;
}

export function SyncDepositsButton({ onSyncComplete, onRefresh }: SyncDepositsButtonProps) {
  const { address } = useAccount();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    if (!address) return;

    setSyncing(true);
    setMessage(null);

    // Immediately refresh balance and transactions
    if (onRefresh) {
      onRefresh();
    }

    try {
      const response = await fetch('/api/sync-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync');
      }

      setMessage(`✅ Synced ${data.synced} deposit(s)! Balance: ${parseFloat(data.balance) / 1e18} MNT`);
      
      // Refresh balance and transactions again after sync completes
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 1000);
      }
      
      if (onSyncComplete) {
        setTimeout(() => {
          onSyncComplete();
        }, 1000);
      }
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to sync'}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!address) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Sync & Refresh</h4>
          <p className="text-xs text-gray-400">
            Sync deposits from blockchain and refresh balance & transactions
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-600 text-black disabled:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </button>
      </div>
      {message && (
        <div className={`mt-3 text-sm ${message.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

