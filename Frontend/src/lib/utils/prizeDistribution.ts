/**
 * Calculate prize distribution for a lobby
 * Top 50% of participants receive prizes
 */
export function calculatePrizeDistribution(
  totalParticipants: number,
  prizePool: bigint
): { rank: number; prizeAmount: bigint; percentage: number }[] {
  if (totalParticipants === 0 || prizePool === BigInt(0)) {
    return [];
  }

  const winnersCount = Math.max(1, Math.floor(totalParticipants / 2)); // Top 50%
  const distribution: { rank: number; prizeAmount: bigint; percentage: number }[] = [];

  // Prize distribution percentages
  const prizePercentages: { [key: number]: number } = {
    1: 40,   // 1st place: 40%
    2: 25,   // 2nd place: 25%
    3: 15,   // 3rd place: 15%
  };

  // Remaining percentage for ranks 4-10
  const top10Percentage = 15; // 15% split among ranks 4-10
  const top10Count = Math.min(7, winnersCount - 3); // 7 positions (4-10) or less

  // Remaining percentage for ranks 11-50%
  const remainingPercentage = 5; // 5% split among remaining winners
  const remainingCount = Math.max(0, winnersCount - 10);

  let distributedPercentage = 0;

  // Top 3 positions
  for (let rank = 1; rank <= Math.min(3, winnersCount); rank++) {
    const percentage = prizePercentages[rank] || 0;
    const prizeAmount = (prizePool * BigInt(Math.floor(percentage * 100))) / BigInt(10000);
    distribution.push({ rank, prizeAmount, percentage });
    distributedPercentage += percentage;
  }

  // Ranks 4-10
  if (top10Count > 0) {
    const percentagePerRank = top10Percentage / top10Count;
    for (let rank = 4; rank <= Math.min(10, winnersCount); rank++) {
      const prizeAmount = (prizePool * BigInt(Math.floor(percentagePerRank * 100))) / BigInt(10000);
      distribution.push({ rank, prizeAmount, percentage: percentagePerRank });
      distributedPercentage += percentagePerRank;
    }
  }

  // Remaining ranks (11-50%)
  if (remainingCount > 0) {
    const percentagePerRank = remainingPercentage / remainingCount;
    for (let rank = 11; rank <= winnersCount; rank++) {
      const prizeAmount = (prizePool * BigInt(Math.floor(percentagePerRank * 100))) / BigInt(10000);
      distribution.push({ rank, prizeAmount, percentage: percentagePerRank });
      distributedPercentage += percentagePerRank;
    }
  }

  // Adjust for rounding errors - add remaining to 1st place
  if (distributedPercentage < 100 && distribution.length > 0) {
    const remaining = BigInt(10000) - (BigInt(Math.floor(distributedPercentage * 100)));
    const adjustment = (prizePool * remaining) / BigInt(10000);
    distribution[0].prizeAmount += adjustment;
    distribution[0].percentage += Number(remaining) / 100;
  }

  return distribution;
}

/**
 * Get prize amount for a specific rank
 */
export function getPrizeForRank(
  rank: number,
  totalParticipants: number,
  prizePool: bigint
): bigint {
  const distribution = calculatePrizeDistribution(totalParticipants, prizePool);
  const prize = distribution.find((d) => d.rank === rank);
  return prize?.prizeAmount || BigInt(0);
}

