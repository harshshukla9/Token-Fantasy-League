import { useState, useEffect, useCallback } from 'react';

export interface Lobby {
  id: string;
  name: string;
  depositAmount: string; // in wei
  currentParticipants: number;
  maxParticipants: number;
  numberOfCoins: number;
  prizePool: string; // in wei
  protocolFee: string; // in wei
  totalFees: string; // in wei
  status: 'open' | 'full' | 'closed' | 'active' | 'ended';
  startTime: Date | string;
  interval: number; // in seconds
  createdBy: string;
  createdAt: Date | string;
}

export function useLobbies(status?: string) {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLobbies = useCallback(async (statusFilter?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = statusFilter
        ? `/api/lobbies?status=${statusFilter}`
        : '/api/lobbies';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch lobbies');

      const data = await response.json();
      setLobbies(data.lobbies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lobbies');
      setLobbies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLobbies(status);
  }, [fetchLobbies, status]);

  return {
    lobbies,
    loading,
    error,
    refetch: () => fetchLobbies(status),
  };
}

export function useLobby(lobbyId: string | null) {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLobby = useCallback(async () => {
    if (!lobbyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lobbies/${lobbyId}`);
      if (!response.ok) throw new Error('Failed to fetch lobby');

      const data = await response.json();
      setLobby(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lobby');
      setLobby(null);
    } finally {
      setLoading(false);
    }
  }, [lobbyId]);

  useEffect(() => {
    fetchLobby();
  }, [fetchLobby]);

  return {
    lobby,
    loading,
    error,
    refetch: fetchLobby,
  };
}

