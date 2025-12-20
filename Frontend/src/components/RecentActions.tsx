'use client';

import { useState, useEffect } from 'react';
import { formatAddress, formatRelativeTime, ACTION_LABELS, ACTION_TYPES, type ReputationAction } from '@/shared';

export function RecentActions() {
  const [actions, setActions] = useState<ReputationAction[]>([]);

  useEffect(() => {
    // Backend removed, using dummy data for now
    setActions([
      {
        actionType: ACTION_TYPES.FOLLOW,
        actor: '0x1234567890123456789012345678901234567890',
        target: '0x0987654321098765432109876543210987654321',
        weight: 10,
        timestamp: Math.floor(Date.now() / 1000),
        txHash: '0x123'
      }
    ]);
  }, []);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-warm-white mb-4">Recent Actions</h2>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={`${action.txHash}-${index}`}
            className="p-3 bg-gray-700/30 rounded-lg border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#00E5FF]">
                {ACTION_LABELS[action.actionType as keyof typeof ACTION_LABELS]}
              </span>
              <span className={`text-sm font-semibold ${action.weight > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {action.weight > 0 ? '+' : ''}{action.weight}
              </span>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>
                From: <code>{formatAddress(action.actor, 4)}</code>
              </div>
              <div>
                To: <code>{formatAddress(action.target, 4)}</code>
              </div>
              <div className="text-gray-500">
                {formatRelativeTime(action.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Waiting for actions...
          </div>
        )}
      </div>
    </div>
  );
}
