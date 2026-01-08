'use client';

import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeft, Crown, Star, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { useParticipantDetails } from '@/hooks/useParticipantDetails';
import { useAvailableCryptos } from '@/hooks/useAvailableCryptos';
import { formatDateTime, formatDuration, calculateEndTime } from '@/shared/utils';

export default function ParticipantLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId as string;
  const participantId = params.participantId as string;

  const { details, loading, error } = useParticipantDetails(lobbyId, participantId);
  const { cryptos: availableCryptos } = useAvailableCryptos({ enabled: true });

  // Helper to get crypto info
  const getCryptoInfo = (cryptoId: string) => {
    return availableCryptos.find((c) => c.id === cryptoId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-20">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-20">
            <p className="text-red-400 text-xl">{error || 'Participant not found'}</p>
            <button
              onClick={() => router.push(`/lobby/${lobbyId}`)}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { participant, lobby, performance } = details;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <ProtectedRoute>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/lobby/${lobbyId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lobby
          </button>

          {/* Header Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{lobby.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>Rank: <span className="text-white font-semibold">#{participant.rank}</span></span>
                  </div>
                  <div>
                    Points: <span className="text-white font-semibold">{participant.points.toFixed(2)}</span>
                  </div>
                  <div>
                    Address: <span className="text-white font-mono text-xs">
                      {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Performance Grid */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Team Performance</h2>
              <div className="text-sm text-gray-400">
                Total Points: <span className="text-green-400 font-bold text-lg">{performance.totalPoints.toFixed(2)}</span>
              </div>
            </div>

            {/* Grid of Crypto Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {performance.cryptoPerformance.map((crypto) => {
                const cryptoInfo = getCryptoInfo(crypto.cryptoId);
                const isPositive = crypto.percentageChange >= 0;

                return (
                  <div
                    key={crypto.cryptoId}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      crypto.isCaptain
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-yellow-500/20 shadow-lg shadow-yellow-400/40'
                        : crypto.isViceCaptain
                          ? 'border-gray-400 bg-gradient-to-br from-gray-400/30 to-gray-500/20 shadow-lg shadow-gray-400/40'
                          : 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-green-600/10'
                    }`}
                  >
                    {/* Captain/Vice-Captain Badge */}
                    {(crypto.isCaptain || crypto.isViceCaptain) && (
                      <div
                        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                          crypto.isCaptain
                            ? 'bg-yellow-400 text-black border-2 border-yellow-300'
                            : 'bg-gray-400 text-black border-2 border-gray-300'
                        }`}
                      >
                        {crypto.isCaptain ? 'C' : 'VC'}
                      </div>
                    )}

                    {/* Crypto Logo and Symbol */}
                    <div className="flex flex-col items-center mb-3">
                      {cryptoInfo?.logo ? (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 overflow-hidden bg-gray-800 border-2 border-gray-700">
                          <img
                            src={cryptoInfo.logo}
                            alt={cryptoInfo.symbol}
                            className="w-14 h-14 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 font-bold text-lg bg-gray-800 border-2 border-gray-700">
                          {cryptoInfo?.symbol?.slice(0, 2) || '??'}
                        </div>
                      )}

                      <div className="text-lg font-bold text-white mb-1">
                        {cryptoInfo?.symbol || crypto.cryptoId.toUpperCase()}
                      </div>
                    </div>

                    {/* Price Information */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Start:</span>
                        <span className="text-white font-semibold">${crypto.startPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Current:</span>
                        <span className="text-white font-semibold">${crypto.currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Change:</span>
                        <span className={`font-semibold flex items-center gap-1 ${
                          isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPositive ? '+' : ''}{crypto.percentageChange.toFixed(2)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Points:</span>
                          <span className={`font-bold text-lg ${
                            crypto.points >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {crypto.points >= 0 ? '+' : ''}{crypto.points.toFixed(2)}
                          </span>
                        </div>
                        {crypto.isCaptain && (
                          <div className="text-xs text-yellow-400 mt-1">×2 Captain Bonus</div>
                        )}
                        {crypto.isViceCaptain && (
                          <div className="text-xs text-gray-400 mt-1">×1.5 VC Bonus</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Total Coins</div>
                <div className="text-white font-bold text-xl">{performance.cryptoPerformance.length}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Positive Performers</div>
                <div className="text-green-400 font-bold text-xl">
                  {performance.cryptoPerformance.filter((c) => c.percentageChange > 0).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Best Performer</div>
                <div className="text-white font-bold text-sm">
                  {(() => {
                    const best = performance.cryptoPerformance.reduce((prev, curr) =>
                      curr.percentageChange > prev.percentageChange ? curr : prev
                    );
                    return getCryptoInfo(best.cryptoId)?.symbol || 'N/A';
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Total Points</div>
                <div className="text-green-400 font-bold text-xl">{performance.totalPoints.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    </div>
  );
}

