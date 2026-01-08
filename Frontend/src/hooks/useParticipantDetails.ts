import { useState, useEffect, useCallback } from 'react';

export interface CryptoPerformance {
  cryptoId: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  startPrice: number;
  currentPrice: number;
  percentageChange: number;
  points: number;
  priceChange: number;
}

export interface ParticipantDetails {
  participant: {
    id: string;
    address: string;
    rank: number;
    points: number;
    joinedAt: Date | string;
    team: {
      cryptos: string[];
      captain: string | null;
      viceCaptain: string | null;
    };
  };
  lobby: {
    id: string;
    name: string;
    startTime: Date | string;
    interval: number;
  };
  performance: {
    totalPoints: number;
    cryptoPerformance: CryptoPerformance[];
    hasStartSnapshot: boolean;
    hasCurrentSnapshot: boolean;
    snapshotTimestamp?: Date | string;
  };
}

export function useParticipantDetails(lobbyId: string | null, participantId: string | null) {
  const [details, setDetails] = useState<ParticipantDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!lobbyId || !participantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lobbies/${lobbyId}/participants/${participantId}`);
      if (!response.ok) throw new Error('Failed to fetch participant details');

      const data = await response.json();
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participant details');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [lobbyId, participantId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    details,
    loading,
    error,
    refetch: fetchDetails,
  };
}

