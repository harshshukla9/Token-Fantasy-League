'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, Medal, Clock } from 'lucide-react';
import { formatAddress } from '@/shared';
import { formatDateTime, formatDuration, calculateEndTime, simulateCurrentPrice, calculateTeamPoints } from '@/shared/utils';
export interface LobbyLeaderboardEntry {
  address: string;
  points: number;
  rank: number;
}
interface LobbyLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId: string;
  lobbyName: string;
  startTime?: Date | string;
  interval?: number;
}

export function LobbyLeaderboard({
  isOpen,
  onClose,
  lobbyId,
  lobbyName,
  startTime,
  interval,
}: LobbyLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LobbyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      // Refresh leaderboard every second to match price updates
      const interval = setInterval(fetchLeaderboard, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, lobbyId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get all teams for this lobby
      const fantasyTeams = JSON.parse(localStorage.getItem('fantasyTeams') || '[]');
      const lobbyParticipants = fantasyTeams.filter(
        (team: any) => team.lobbyId === lobbyId
      );

      // Get current prices for all coins (simulated)
      const coinInitialPrices = JSON.parse(localStorage.getItem('coinInitialPrices') || '[]');
      
      // Create a function to get current price for a crypto
      // Prices update every 10 seconds based on time-based seed
      const getCurrentPrice = (cryptoId: string, initialPrice: number, initialChange24h: number, joinedAt: string): number => {
        // Find the base price from initial prices (when lobby started)
        const baseCoin = coinInitialPrices.find((coin: any) => coin.id === cryptoId);
        if (baseCoin) {
          // Use the stored initial price from when lobby started
          // Simulate current price based on time elapsed since lobby start
          return simulateCurrentPrice(baseCoin.price, baseCoin.change24h, baseCoin.timestamp, 0.04);
        }
        // Fallback: use the team's initial price and simulate from join time
        return simulateCurrentPrice(initialPrice, initialChange24h, joinedAt, 0.04);
      };

      // Calculate points for each team based on price performance
      const entries: LobbyLeaderboardEntry[] = lobbyParticipants
        .filter((team: any) => team.userAddress && team.selectedCryptos) // Only include teams with valid data
        .map((team: any) => {
          let totalPoints = 0;
          
          // Calculate points for each crypto in the team
          team.selectedCryptos.forEach((crypto: any) => {
            const currentPrice = getCurrentPrice(
              crypto.id,
              crypto.initialPrice,
              crypto.initialChange24h || 0,
              team.joinedAt
            );
            
            // Calculate points with multipliers
            const priceChange = ((currentPrice - crypto.initialPrice) / crypto.initialPrice) * 100;
            let cryptoPoints = priceChange * 100; // 100 points per 1% change
            
            // Apply multipliers
            if (crypto.isCaptain) {
              cryptoPoints *= 2; // Captain gets 2x
            } else if (crypto.isViceCaptain) {
              cryptoPoints *= 1.5; // Vice-Captain gets 1.5x
            }
            
            totalPoints += cryptoPoints;
          });
          
          return {
            address: team.userAddress,
            points: Math.round(Math.max(0, totalPoints)), // Ensure non-negative
            rank: 0, // Will be set after sorting
          };
        });

      // Sort by points descending
      entries.sort((a, b) => b.points - a.points);
      
      // Update ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Add some mock participants if we have less than 5 (for demo)
      if (entries.length < 5) {
        const mockAddresses = [
          '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
          '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        ];
        
        const existingAddresses = new Set(entries.map(e => e.address));
        let mockRank = entries.length + 1;
        
        for (const address of mockAddresses) {
          if (entries.length >= 10) break;
          if (!existingAddresses.has(address)) {
            entries.push({
              address,
              points: Math.max(50, 1000 - (mockRank * 80) + Math.floor(Math.random() * 100)),
              rank: mockRank++,
            });
          }
        }
        
        // Re-sort and update ranks
        entries.sort((a, b) => b.points - a.points);
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }

      setLeaderboard(entries);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch lobby leaderboard:', error);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gray-900 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
            <p className="text-sm text-gray-400 mt-1">{lobbyName}</p>
            {startTime && interval && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>
                  Duration: <span className="text-white">{formatDuration(interval)}</span>
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  Starts: <span className="text-white">{formatDateTime(startTime)}</span>
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  Ends: <span className="text-white">{formatDateTime(calculateEndTime(startTime, interval))}</span>
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No participants yet. Be the first to join!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.address}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    entry.rank === 1
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : entry.rank === 2
                        ? 'bg-gray-400/10 border-gray-400/30'
                        : entry.rank === 3
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      {entry.rank === 1 ? (
                        <Trophy className="h-6 w-6 text-yellow-400" />
                      ) : entry.rank === 2 ? (
                        <Medal className="h-6 w-6 text-gray-300" />
                      ) : entry.rank === 3 ? (
                        <Medal className="h-6 w-6 text-orange-400" />
                      ) : (
                        <span
                          className={`text-lg font-bold ${
                            entry.rank <= 3
                              ? entry.rank === 1
                                ? 'text-yellow-400'
                                : entry.rank === 2
                                  ? 'text-gray-300'
                                  : 'text-orange-400'
                              : 'text-gray-400'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex-1">
                      <code className="text-sm text-gray-300 font-mono">
                        {formatAddress(entry.address, 8)}
                      </code>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <p className="text-xs text-gray-400 text-center">
            Leaderboard updates in real-time. Points are calculated based on team performance.
          </p>
        </div>
      </div>
    </div>
  );
}

