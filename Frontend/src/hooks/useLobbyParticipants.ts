import { useState, useEffect, useCallback } from 'react';

export interface LobbyParticipant {
  id: string;
  address: string;
  team: {
    cryptos: string[];
    captain: string | null;
    viceCaptain: string | null;
  };
  entryFee: string;
  points: number;
  rank: number;
  prizeAmount: string;
  hasPrize: boolean;
  joinedAt: Date | string;
  isCurrentUser: boolean;
}

export function useLobbyParticipants(lobbyId: string | null, userAddress?: string) {
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserTeam, setCurrentUserTeam] = useState<LobbyParticipant | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!lobbyId) return;

    setLoading(true);
    setError(null);

    try {
      const url = userAddress
        ? `/api/lobbies/${lobbyId}/participants?address=${userAddress}`
        : `/api/lobbies/${lobbyId}/participants`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch participants');

      const data = await response.json();
      setParticipants(data.participants || []);

      // Find current user's team
      const userTeam = data.participants?.find((p: LobbyParticipant) => p.isCurrentUser);
      setCurrentUserTeam(userTeam || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
      setParticipants([]);
      setCurrentUserTeam(null);
    } finally {
      setLoading(false);
    }
  }, [lobbyId, userAddress]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  return {
    participants,
    currentUserTeam,
    loading,
    error,
    refetch: fetchParticipants,
  };
}

