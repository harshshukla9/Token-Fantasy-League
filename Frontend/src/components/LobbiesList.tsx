'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Users, DollarSign, Coins, ArrowRight, Clock, Plus } from 'lucide-react';
import { formatEther } from 'viem';
import { formatDateTime, formatDuration, calculateEndTime } from '@/shared/utils';
import { useLobbies, Lobby } from '@/hooks/useLobbies';
import { CreateLobbyModal } from './CreateLobbyModal';
import { isAdmin } from '@/lib/utils/admin';

// Export Lobby type for backward compatibility
export type { Lobby };

interface LobbyRowProps {
  lobby: Lobby;
  onJoin?: (lobbyId: string) => void;
  hasJoined?: boolean;
}

const LobbyRow: React.FC<LobbyRowProps> = ({ lobby, onJoin, hasJoined = false }) => {
  const router = useRouter();
  const isFull = lobby.currentParticipants >= lobby.maxParticipants;
  const isOpen = lobby.status === 'open' && !isFull;
  const participationPercentage = (lobby.currentParticipants / lobby.maxParticipants) * 100;
  
  // Convert wei to MNT for display
  const depositAmountMNT = parseFloat(formatEther(BigInt(lobby.depositAmount || '0')));
  const prizePoolMNT = parseFloat(formatEther(BigInt(lobby.prizePool || '0')));

  const handleAction = () => {
    if (hasJoined) {
      router.push(`/lobby/${lobby.id}`);
    } else if (onJoin) {
      onJoin(lobby.id);
    }
  };

  return (
    <tr
      className={`border-b border-gray-800 transition-colors hover:bg-gray-900 ${
        !isOpen ? 'opacity-60' : ''
      }`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">{lobby.name}</h3>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wider ${
              isOpen
                ? 'bg-white/20 text-white'
                : isFull
                  ? 'bg-gray-600/20 text-gray-400'
                  : 'bg-gray-700/20 text-gray-500'
            }`}
          >
            {isOpen ? 'Open' : isFull ? 'Full' : 'Closed'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-gray-400" />
          <span className="text-white font-semibold">{lobby.numberOfCoins}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-white font-semibold">{depositAmountMNT.toFixed(2)}</span>
          <span className="text-sm text-gray-400">MNT</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <div className="flex-1 min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white font-semibold">
                {lobby.currentParticipants} / {lobby.maxParticipants}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${participationPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-white font-semibold">
          {prizePoolMNT.toFixed(2)} <span className="text-sm text-gray-400">MNT</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Duration: {formatDuration(lobby.interval)}</span>
          </div>
          <div className="text-xs text-gray-500">
            Starts: {formatDateTime(lobby.startTime)}
          </div>
          <div className="text-xs text-gray-500">
            Ends: {formatDateTime(calculateEndTime(lobby.startTime, lobby.interval))}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={handleAction}
          disabled={!isOpen && !hasJoined}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
            hasJoined
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer'
              : isOpen
                ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasJoined ? (
            'ALREADY JOINED'
          ) : isOpen ? (
            <>
              Create Team
              <ArrowRight className="h-4 w-4" />
            </>
          ) : isFull ? (
            'Full'
          ) : (
            'Closed'
          )}
        </button>
      </td>
    </tr>
  );
};

export function LobbiesList() {
  const router = useRouter();
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'full' | 'closed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinedLobbies, setJoinedLobbies] = useState<Set<string>>(new Set());
  
  const { lobbies, loading, error, refetch } = useLobbies();

  // Check which lobbies the user has already joined
  useEffect(() => {
    const checkJoinedLobbies = async () => {
      if (!address || lobbies.length === 0) {
        setJoinedLobbies(new Set());
        return;
      }

      const joined = new Set<string>();
      
      // Check each lobby in parallel
      const checks = lobbies.map(async (lobby) => {
        try {
          const response = await fetch(`/api/lobbies/${lobby.id}/participant?address=${address}`);
          const data = await response.json();
          
          if (data.hasTeam) {
            joined.add(lobby.id);
          }
        } catch (error) {
          console.error(`Error checking lobby ${lobby.id}:`, error);
        }
      });

      await Promise.all(checks);
      setJoinedLobbies(joined);
    };

    checkJoinedLobbies();
  }, [address, lobbies]);

  const isUserAdmin = address ? isAdmin(address) : false;

  const handleJoin = (lobbyId: string) => {
    router.push(`/lobby/${lobbyId}/join`);
  };

  const filteredLobbies = lobbies.filter((lobby) => {
    const matchesSearch = lobby.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'open' && lobby.status === 'open' && lobby.currentParticipants < lobby.maxParticipants) ||
      (filterStatus === 'full' && lobby.currentParticipants >= lobby.maxParticipants) ||
      (filterStatus === 'closed' && lobby.status === 'closed');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Available Lobbies</h2>
        {isUserAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Lobby
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search lobbies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600/20"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['all', 'open', 'full', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Lobbies List Table */}
      {!loading && !error && filteredLobbies.length > 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Lobby Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Coins
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Entry Fee
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participants
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Prize Pool
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Period
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredLobbies.map((lobby) => (
                  <LobbyRow 
                    key={lobby.id} 
                    lobby={lobby} 
                    onJoin={handleJoin}
                    hasJoined={joinedLobbies.has(lobby.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-12 text-center">
          <p className="text-lg text-gray-400">No lobbies found matching your criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
            className="mt-4 text-white hover:text-gray-300 cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Create Lobby Modal */}
      <CreateLobbyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

