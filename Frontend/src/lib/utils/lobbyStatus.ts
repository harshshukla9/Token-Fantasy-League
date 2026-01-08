/**
 * Utility functions for calculating lobby status based on time and participants
 */

/**
 * Calculate lobby status based on current time, start time, end time, and participant count
 * @param startTime - Lobby start time
 * @param interval - Duration in seconds
 * @param currentParticipants - Current number of participants
 * @param maxParticipants - Maximum number of participants
 * @param currentStatus - Current status in DB (for 'closed' which is manual)
 * @returns Calculated status
 */
export function calculateLobbyStatus(
  startTime: Date | string,
  interval: number,
  currentParticipants: number,
  maxParticipants: number,
  currentStatus: string = 'open'
): 'open' | 'live' | 'full' | 'ended' | 'closed' {
  // If manually closed, keep it closed
  if (currentStatus === 'closed') {
    return 'closed';
  }

  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(start.getTime() + interval * 1000);

  // Check if lobby is full
  if (currentParticipants >= maxParticipants) {
    // If it's full and past end time, mark as ended
    if (now >= end) {
      return 'ended';
    }
    // If it's full but not ended, mark as full
    return 'full';
  }

  // Check time-based status
  if (now < start) {
    // Before start time - open for joining
    return 'open';
  } else if (now >= start && now < end) {
    // Between start and end - live (no new teams can be created)
    return 'live';
  } else {
    // After end time - ended
    return 'ended';
  }
}

/**
 * Check if lobby allows team creation
 * @param status - Lobby status
 * @returns true if team creation is allowed
 */
export function canCreateTeam(status: string): boolean {
  return status === 'open';
}

/**
 * Check if lobby is active (live or ended)
 * @param status - Lobby status
 * @returns true if lobby is active
 */
export function isLobbyActive(status: string): boolean {
  return status === 'live' || status === 'ended';
}

