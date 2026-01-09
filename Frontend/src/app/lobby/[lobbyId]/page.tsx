'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeft, Crown, Star, Trophy, Users, Clock, ArrowRight } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { formatDateTime, formatDuration, calculateEndTime } from '@/shared/utils';
import { useLobby } from '@/hooks/useLobbies';
import { useLobbyParticipants } from '@/hooks/useLobbyParticipants';
import { useAvailableCryptos } from '@/hooks/useAvailableCryptos';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useLobbyPoints } from '@/hooks/useLobbyPoints';
import { canCreateTeam } from '@/lib/utils/lobbyStatus';

export default function LobbyViewPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId as string;
  const { address, isConnected } = useAccount();

  const { lobby, loading: lobbyLoading, error: lobbyError } = useLobby(lobbyId);
  const { participants, currentUserTeam, loading: participantsLoading, refetch: refetchParticipants } = useLobbyParticipants(
    lobbyId,
    address
  );
  const { cryptos: availableCryptos } = useAvailableCryptos({ enabled: true });
  
  // Auto-update points every 10 seconds (stops when lobby ends)
  const { updating: pointsUpdating, lastUpdate, isEnded: pointsEnded } = useLobbyPoints(
    lobbyId,
    lobby?.status !== 'ended' && lobby?.status !== 'closed'
  );
  
  const isLobbyEnded = lobby?.status === 'ended' || lobby?.status === 'closed' || pointsEnded;
  
  // Refetch participants when points are updated
  useEffect(() => {
    if (lastUpdate) {
      refetchParticipants();
    }
  }, [lastUpdate, refetchParticipants]);

  // Helper to get crypto info
  const getCryptoInfo = (cryptoId: string) => {
    return availableCryptos.find((c) => c.id === cryptoId);
  };

  if (lobbyLoading) {
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

  if (lobbyError || !lobby) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-20">
            <p className="text-red-400 text-xl">{lobbyError || 'Lobby not found'}</p>
            <button
              onClick={() => router.push('/lobbies')}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Lobbies
            </button>
          </div>
        </main>
      </div>
    );
  }

  const prizePoolMNT = parseFloat(formatEther(BigInt(lobby.prizePool || '0'))).toFixed(2);
  const entryFeeMNT = parseFloat(formatEther(BigInt(lobby.depositAmount || '0'))).toFixed(2);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <ProtectedRoute>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/lobbies')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lobbies
          </button>

          {/* Lobby Header Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{lobby.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div>
                    Entry Fee: <span className="text-white font-semibold">{entryFeeMNT} MNT</span>
                  </div>
                  <div>
                    Prize Pool: <span className="text-green-400 font-semibold">{prizePoolMNT} MNT</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {lobby.currentParticipants} / {lobby.maxParticipants}
                    </span>
                  </div>
                </div>
                {lobby.startTime && lobby.interval && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      Duration: <span className="text-white">{formatDuration(lobby.interval)}</span>
                      {' • '}
                      Starts: <span className="text-white">{formatDateTime(lobby.startTime)}</span>
                      {' • '}
                      Ends: <span className="text-white">{formatDateTime(calculateEndTime(lobby.startTime, lobby.interval))}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Countdown Timer */}
              {lobby.startTime && lobby.interval && (() => {
                const now = new Date();
                const startTime = new Date(lobby.startTime);
                const endTime = calculateEndTime(lobby.startTime, lobby.interval);
                const hasStarted = now >= startTime;
                const targetDate = hasStarted ? endTime : startTime;
                const label = hasStarted ? 'Ends In' : 'Starts In';

                return (
                  <div className="ml-6 border-l border-gray-700 pl-6">
                    <CountdownTimer targetDate={targetDate} label={label} />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User's Team */}
            <div className="lg:col-span-2 space-y-6">
              {currentUserTeam ? (
                <>
                  {/* My Team Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white">My Team</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Trophy className="w-4 h-4" />
                        <span>Rank: #{currentUserTeam.rank}</span>
                        <span className="text-gray-600">•</span>
                        <span>Points: {currentUserTeam.points}</span>
                      </div>
                    </div>

                    {/* Team Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {currentUserTeam.team?.cryptos && currentUserTeam.team.cryptos.length > 0 ? (
                        currentUserTeam.team.cryptos.map((cryptoId) => {
                          const crypto = getCryptoInfo(cryptoId);
                          const isCaptain = currentUserTeam.team.captain === cryptoId;
                          const isViceCaptain = currentUserTeam.team.viceCaptain === cryptoId;

                          if (!crypto) return null;

                          return (
                            <div
                              key={cryptoId}
                              className={`relative p-4 rounded-xl border-2 transition-all ${
                                isCaptain
                                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-yellow-500/20 shadow-lg shadow-yellow-400/40'
                                  : isViceCaptain
                                    ? 'border-gray-400 bg-gradient-to-br from-gray-400/30 to-gray-500/20 shadow-lg shadow-gray-400/40'
                                    : 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-green-600/10'
                              }`}
                            >
                              {(isCaptain || isViceCaptain) && (
                                <div
                                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                                    isCaptain
                                      ? 'bg-yellow-400 text-black border-2 border-yellow-300'
                                      : 'bg-gray-400 text-black border-2 border-gray-300'
                                  }`}
                                >
                                  {isCaptain ? 'C' : 'VC'}
                                </div>
                              )}

                              <div className="flex flex-col items-center">
                                {crypto.logo ? (
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 overflow-hidden bg-gray-800 border-2 border-gray-700">
                                    <img
                                      src={crypto.logo}
                                      alt={crypto.symbol}
                                      className="w-10 h-10 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 font-bold text-sm bg-gray-800 border-2 border-gray-700">
                                    {crypto.symbol.slice(0, 2)}
                                  </div>
                                )}

                                <div className="text-sm font-bold text-white mb-1">
                                  {crypto.symbol}
                                </div>
                                <div className="text-xs text-gray-300">
                                  ${crypto.price?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full text-center py-8 text-gray-400">
                          <p>No cryptos selected</p>
                        </div>
                      )}
                    </div>

                    {/* Team Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-400">Captain:</span>{' '}
                          <span className="text-yellow-400 font-semibold">
                            {currentUserTeam.team.captain
                              ? getCryptoInfo(currentUserTeam.team.captain)?.symbol || 'N/A'
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Vice-Captain:</span>{' '}
                          <span className="text-gray-300 font-semibold">
                            {currentUserTeam.team.viceCaptain
                              ? getCryptoInfo(currentUserTeam.team.viceCaptain)?.symbol || 'N/A'
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        Joined: {new Date(currentUserTeam.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Join Button if not joined */}
                  {!currentUserTeam && (
                    <div className="card p-6 text-center">
                      <p className="text-gray-400 mb-4">You haven&apos;t joined this lobby yet</p>
                      <button
                        onClick={() => router.push(`/lobby/${lobbyId}/join`)}
                        className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                      >
                        Create Team & Join
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-6 text-center">
                  <p className="text-gray-400 mb-4">You haven&apos;t joined this lobby yet</p>
                  <button
                    onClick={() => router.push(`/lobby/${lobbyId}/join`)}
                    disabled={!canCreateTeam(lobby.status)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      canCreateTeam(lobby.status)
                        ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {lobby.status === 'live' 
                      ? 'Market is Live - Team Creation Closed'
                      : lobby.status === 'ended'
                        ? 'Market Ended'
                        : lobby.status === 'full'
                          ? 'Lobby Full'
                          : 'Create Team & Join'}
                  </button>
                  {!canCreateTeam(lobby.status) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {lobby.status === 'live' && 'Teams can only be created before the market starts'}
                      {lobby.status === 'ended' && 'This lobby has ended'}
                      {lobby.status === 'full' && 'Maximum participants reached'}
                    </p>
                  )}
                </div>
              )}

              {/* Winners Section - Show when lobby has ended */}
              {isLobbyEnded && participants.length > 0 && (
                <div className="card p-6 mb-6 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white">🏆 Tournament Winners</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1st Place */}
                    {participants[0] && (
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Trophy className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-yellow-400 font-bold text-lg mb-1">1st Place</div>
                        <div className="text-white font-semibold mb-2">
                          {participants[0].address.slice(0, 6)}...{participants[0].address.slice(-4)}
                        </div>
                        <div className="text-yellow-300 font-bold text-xl mb-1">
                          {participants[0].points.toFixed(2)} pts
                        </div>
                        {participants[0].hasPrize && (
                          <div className="text-yellow-400 text-sm font-medium">
                            Prize: {parseFloat(formatEther(BigInt(participants[0].prizeAmount))).toFixed(4)} MNT
                          </div>
                        )}
                      </div>
                    )}
                    {/* 2nd Place */}
                    {participants[1] && (
                      <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Trophy className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="text-gray-300 font-bold text-lg mb-1">2nd Place</div>
                        <div className="text-white font-semibold mb-2">
                          {participants[1].address.slice(0, 6)}...{participants[1].address.slice(-4)}
                        </div>
                        <div className="text-gray-200 font-bold text-xl mb-1">
                          {participants[1].points.toFixed(2)} pts
                        </div>
                        {participants[1].hasPrize && (
                          <div className="text-gray-300 text-sm font-medium">
                            Prize: {parseFloat(formatEther(BigInt(participants[1].prizeAmount))).toFixed(4)} MNT
                          </div>
                        )}
                      </div>
                    )}
                    {/* 3rd Place */}
                    {participants[2] && (
                      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Trophy className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-orange-400 font-bold text-lg mb-1">3rd Place</div>
                        <div className="text-white font-semibold mb-2">
                          {participants[2].address.slice(0, 6)}...{participants[2].address.slice(-4)}
                        </div>
                        <div className="text-orange-300 font-bold text-xl mb-1">
                          {participants[2].points.toFixed(2)} pts
                        </div>
                        {participants[2].hasPrize && (
                          <div className="text-orange-400 text-sm font-medium">
                            Prize: {parseFloat(formatEther(BigInt(participants[2].prizeAmount))).toFixed(4)} MNT
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Participants Leaderboard */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">
                        {isLobbyEnded ? 'Final Leaderboard' : 'Leaderboard'}
                      </h2>
                      {isLobbyEnded && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded">
                          LOCKED
                        </span>
                      )}
                    </div>
                    {pointsUpdating && !isLobbyEnded && (
                      <p className="text-xs text-green-400 mt-1">Updating points...</p>
                    )}
                    {lastUpdate && !pointsUpdating && !isLobbyEnded && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                      </p>
                    )}
                    {isLobbyEnded && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Tournament ended • Final results locked
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {participantsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p>No participants yet</p>
                    <p className="text-sm text-gray-500 mt-1">Be the first to join!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.slice(0, 10).map((participant, index) => (
                      <div
                        key={participant.id}
                        onClick={() => router.push(`/lobby/${lobbyId}/leaderboard/${participant.id}`)}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                          participant.isCurrentUser
                            ? 'bg-blue-900/30 border border-blue-500/30 hover:bg-blue-900/40'
                            : 'bg-gray-800/50 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              participant.rank === 1
                                ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                                : participant.rank === 2
                                  ? 'bg-gray-400/20 text-gray-400 border-2 border-gray-400/50'
                                  : participant.rank === 3
                                    ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/50'
                                    : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {participant.rank === 1 ? (
                              <Trophy className="w-5 h-5" />
                            ) : (
                              participant.rank
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                              </span>
                              {participant.isCurrentUser && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {participant.team.cryptos.length} cryptos • C: {participant.team.captain ? getCryptoInfo(participant.team.captain)?.symbol : 'N/A'} • VC: {participant.team.viceCaptain ? getCryptoInfo(participant.team.viceCaptain)?.symbol : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-white font-semibold">{participant.points.toFixed(2)} pts</div>
                            {participant.hasPrize && (
                              <div className="text-xs text-yellow-400 font-medium">
                                Prize: {parseFloat(formatEther(BigInt(participant.prizeAmount))).toFixed(4)} MNT
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {new Date(participant.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Lobby Stats */}
            <div className="space-y-6">
              {/* Lobby Stats Card */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Lobby Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span
                      className={`font-semibold ${
                        lobby.status === 'open'
                          ? 'text-green-400'
                          : lobby.status === 'live'
                            ? 'text-blue-400'
                            : lobby.status === 'ended'
                              ? 'text-gray-400'
                              : lobby.status === 'full'
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                      }`}
                    >
                      {lobby.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Participants</span>
                    <span className="text-white font-semibold">
                      {lobby.currentParticipants} / {lobby.maxParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entry Fee</span>
                    <span className="text-white font-semibold">{entryFeeMNT} MNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="text-green-400 font-semibold">{prizePoolMNT} MNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protocol Fee</span>
                    <span className="text-gray-400 text-sm">
                      {parseFloat(formatEther(BigInt(lobby.protocolFee || '0'))).toFixed(2)} MNT
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {currentUserTeam ? (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  <button
                    onClick={() => router.push(`/lobby/${lobbyId}/join`)}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    View Team Details
                  </button>
                </div>
              ) : (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Join This Lobby</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Create your team and compete for the prize pool!
                  </p>
                  <button
                    onClick={() => router.push(`/lobby/${lobbyId}/join`)}
                    className="w-full px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-colors"
                  >
                    Create Team
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </ProtectedRoute>
    </div>
  );
}

