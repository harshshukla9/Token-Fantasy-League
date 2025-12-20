'use client';

import { useState, useEffect } from 'react';
import { formatAddress, formatNumber, type LeaderboardEntry } from '@/shared';
import { MOCK_LEADERBOARD_DATA } from '@/data/mockData';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {


      // Use shared mock data
      const dummyEntries: LeaderboardEntry[] = MOCK_LEADERBOARD_DATA;

      const data = {
        success: true,
        data: dummyEntries
      };

      if (data.success) {
        setLeaderboard(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-warm-white mb-4">Leaderboard</h2>
        <div className="text-center text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-warm-white">Leaderboard</h2>
        <span className="text-sm text-gray-400">Top 50</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 py-3 px-2">Rank</th>
              <th className="text-left text-gray-400 py-3 px-2">Address</th>
              <th className="text-right text-gray-400 py-3 px-2">Score</th>
              <th className="text-right text-gray-400 py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.address}
                className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-3 px-2">
                  <span className={`font-bold ${getRankColor(index + 1)}`}>
                    #{index + 1}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <code className="text-sm text-gray-300">{formatAddress(entry.address, 6)}</code>
                </td>
                <td className="text-right py-3 px-2 font-semibold text-warm-white">
                  {formatNumber(entry.score)}
                </td>
                <td className="text-right py-3 px-2 text-gray-400">
                  {entry.actionCount || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No reputation data yet. Start performing actions!
          </div>
        )}
      </div>
    </div>
  );
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-orange-400';
  return 'text-gray-400';
}
