import { useState, useEffect, useCallback } from 'react'; 

export function useLobbyPoints(lobbyId: string | null, autoUpdate: boolean = true) {
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);

  const updatePoints = useCallback(async () => {
    if (!lobbyId || isEnded) return;

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/lobbies/${lobbyId}/update-points`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Failed to update points';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check if lobby has ended
      if (data.ended) {
        setIsEnded(true);
        return data;
      }

      setLastUpdate(new Date());
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update points';
      console.error('Error updating points:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [lobbyId, isEnded]);

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

  // Auto-update every 10 seconds if enabled (only if lobby hasn't ended)
  useEffect(() => {
    if (!autoUpdate || !lobbyId || isEnded) return;

    // Check for auto-snapshot on mount and every minute
    checkAutoSnapshot();
    const snapshotInterval = setInterval(checkAutoSnapshot, 60000); // Check every minute

    // Initial points update
    updatePoints();

    // Set up interval for points update every 10 seconds
    const pointsInterval = setInterval(() => {
      if (!isEnded) {
        updatePoints();
      }
    }, 10000); // 10 seconds

    return () => {
      clearInterval(snapshotInterval);
      clearInterval(pointsInterval);
    };
  }, [autoUpdate, lobbyId, updatePoints, checkAutoSnapshot, isEnded]);

  return {
    updatePoints,
    updating,
    lastUpdate,
    error,
    isEnded,
  };
}

