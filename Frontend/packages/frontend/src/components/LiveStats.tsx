'use client';

import { useReadContract } from 'wagmi';
import { formatNumber } from '@/shared';
import { MOCK_LEADERBOARD_DATA } from '@/data/mockData';

const REPUTATION_CORE_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_CORE_ADDRESS as `0x${string}`;

const REPUTATION_CORE_ABI = [
  {
    inputs: [],
    name: 'totalUsers',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

import { useState, useEffect } from 'react';

import { Users, Zap, Trophy } from 'lucide-react';

export function LiveStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActions: 0,
    highestScore: 0
  });

  // Query totalUsers from blockchain
  const { data: totalUsers } = useReadContract({
    address: REPUTATION_CORE_ADDRESS,
    abi: REPUTATION_CORE_ABI,
    functionName: 'totalUsers',
  });

  const fetchStats = async () => {
    try {


      // Calculate highest score from mock data
      const highestScore = Math.max(...MOCK_LEADERBOARD_DATA.map(entry => entry.score));

      // Simulate successful response with dummy data
      const data = {
        success: true,
        data: {
          reputation: {
            totalUsers: 1250,
            totalActions: 45678,
            highestScore: highestScore
          }
        }
      };



      if (data.success) {
        setStats(data.data.reputation);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Users"
        value={totalUsers ? formatNumber(Number(totalUsers)) : formatNumber(stats.totalUsers)}
        icon={<Users className="w-9 h-9 text-[#00E5FF]" />}
      />
      <StatCard
        title="Total Actions"
        value={formatNumber(stats.totalActions)}
        icon={<Zap className="w-9 h-9 text-[#00E5FF]" />}
      />
      <StatCard
        title="Highest Score"
        value={formatNumber(stats.highestScore)}
        icon={<Trophy className="w-9 h-9 text-[#00E5FF]" />}
      />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card cursor-target">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-warm-white">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}
