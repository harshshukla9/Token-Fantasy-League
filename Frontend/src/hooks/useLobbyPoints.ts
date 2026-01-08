import { useState, useEffect, useCallback } from 'react';

export function useLobbyPoints(lobbyId: string | null, autoUpdate: boolean = true) {
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatePoints = useCallback(async () => {
    if (!lobbyId) return;

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/lobbies/${lobbyId}/update-points`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update points');
      }

      const data = await response.json();
      setLastUpdate(new Date());
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update points');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [lobbyId]);

  // Check and trigger auto-snapshot if needed (when lobby starts/ends)
  const checkAutoSnapshot = useCallback(async () => {
    if (!lobbyId) return;

    try {
      await fetch(`/api/lobbies/${lobbyId}/auto-snapshot`, {
        method: 'POST',
      });
    } catch (err) {
      // Silently fail - snapshot check is not critical
      console.warn('Auto-snapshot check failed:', err);
    }
  }, [lobbyId]);

  // Auto-update every 10 seconds if enabled
  useEffect(() => {
    if (!autoUpdate || !lobbyId) return;

    // Check for auto-snapshot on mount and every minute
    checkAutoSnapshot();
    const snapshotInterval = setInterval(checkAutoSnapshot, 60000); // Check every minute

    // Initial points update
    updatePoints();

    // Set up interval for points update every 10 seconds
    const pointsInterval = setInterval(() => {
      updatePoints();
    }, 10000); // 10 seconds

    return () => {
      clearInterval(snapshotInterval);
      clearInterval(pointsInterval);
    };
  }, [autoUpdate, lobbyId, updatePoints, checkAutoSnapshot]);

  return {
    updatePoints,
    updating,
    lastUpdate,
    error,
  };
}

