'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export function SyncDepositsButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const { address } = useAccount();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    if (!address) return;

    setSyncing(true);
    setMessage(null);

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
    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-500/30">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Sync Existing Deposits</h4>
          <p className="text-xs text-gray-400">
            Fetch your deposits from the blockchain and update your balance
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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

