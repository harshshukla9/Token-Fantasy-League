'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, Coins, ArrowRight, Clock } from 'lucide-react';
import { formatDateTime, formatDuration, calculateEndTime } from '@/shared/utils';

export interface Lobby {
  id: string;
  name: string;
  depositAmount: number; // Entry fee in tokens
  currentParticipants: number;
  maxParticipants: number;
  numberOfCoins: number; // Number of cryptocurrencies in this lobby
  prizePool: number; // Total prize pool
  status: 'open' | 'full' | 'closed';
  startTime: Date | string; // Pool start time
  interval: number; // Duration in seconds (e.g., 7 days = 604800)
}

// Mock data - replace with actual API call
const mockLobbies: Lobby[] = [
  {
    id: '1',
    name: 'Premium League - Week 1',
    depositAmount: 5,
    currentParticipants: 45,
    maxParticipants: 50,
    numberOfCoins: 8,
    prizePool: 225,
    status: 'open',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    interval: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  {
    id: '2',
    name: 'Standard League - Week 1',
    depositAmount: 4,
    currentParticipants: 32,
    maxParticipants: 100,
    numberOfCoins: 8,
    prizePool: 128,
    status: 'open',
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    interval: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  {
    id: '3',
    name: 'Beginner League - Week 1',
    depositAmount: 2,
    currentParticipants: 78,
    maxParticipants: 100,
    numberOfCoins: 8,
    prizePool: 156,
    status: 'open',
    startTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    interval: 3 * 24 * 60 * 60, // 3 days in seconds
  },
  {
    id: '4',
    name: 'Elite League - Week 1',
    depositAmount: 5,
    currentParticipants: 20,
    maxParticipants: 25,
    numberOfCoins: 8,
    prizePool: 100,
    status: 'open',
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    interval: 14 * 24 * 60 * 60, // 14 days in seconds
  },
  {
    id: '5',
    name: 'Mini League - Week 1',
    depositAmount: 3,
    currentParticipants: 100,
    maxParticipants: 100,
    numberOfCoins: 8,
    prizePool: 300,
    status: 'full',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
    interval: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  {
    id: '6',
    name: 'Premium League - Week 2',
    depositAmount: 4,
    currentParticipants: 12,
    maxParticipants: 50,
    numberOfCoins: 8,
    prizePool: 48,
    status: 'open',
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    interval: 7 * 24 * 60 * 60, // 7 days in seconds
  },
];

interface LobbyRowProps {
  lobby: Lobby;
  onJoin?: (lobbyId: string) => void;
}

const LobbyRow: React.FC<LobbyRowProps> = ({ lobby, onJoin }) => {
  const isFull = lobby.currentParticipants >= lobby.maxParticipants;
  const isOpen = lobby.status === 'open' && !isFull;
  const participationPercentage = (lobby.currentParticipants / lobby.maxParticipants) * 100;

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
          <span className="text-white font-semibold">{lobby.depositAmount}</span>
          <span className="text-sm text-gray-400">MON</span>
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
          {lobby.prizePool} <span className="text-sm text-gray-400">MON</span>
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
          onClick={() => onJoin && onJoin(lobby.id)}
          disabled={!isOpen}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
            isOpen
              ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isOpen ? (
            <>
              Join
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
  const [lobbies] = useState<Lobby[]>(mockLobbies);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'full' | 'closed'>('all');

  const handleJoin = (lobbyId: string) => {
    // Navigate to join page
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

      {/* Lobbies List Table */}
      {filteredLobbies.length > 0 ? (
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
                  <LobbyRow key={lobby.id} lobby={lobby} onJoin={handleJoin} />
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
    </div>
  );
}

