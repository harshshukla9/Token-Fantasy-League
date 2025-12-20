'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { formatAddress, formatNumber } from '@/shared';

interface UserProfile {
  address: string;
  username?: string;
  bio?: string;
  isVerified: boolean;
  score: number;
  rank: number;
  totalActions: number;
}

interface Action {
  actionType: string;
  actor: string;
  target: string;
  weight: number;
  timestamp: number;
  txHash: string;
}

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);


        // Simulate successful response with dummy data
        const data = {
          success: true,
          data: {
            address: address,
            username: 'MonadUser',
            bio: 'This is a simulated profile since the backend is currently disabled.',
            isVerified: true,
            score: 1250,
            rank: 42,
            totalActions: 156
          }
        };

        if (data.success) {
          setProfile(data.data);
          // Also set some dummy actions
          setActions([
            {
              actionType: 'FOLLOW',
              actor: '0x123...abc',
              target: address,
              weight: 10,
              timestamp: Math.floor(Date.now() / 1000) - 3600,
              txHash: '0x...'
            },
            {
              actionType: 'LIKE',
              actor: '0x456...def',
              target: address,
              weight: 5,
              timestamp: Math.floor(Date.now() / 1000) - 7200,
              txHash: '0x...'
            }
          ]);
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Failed to connect to API');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#00E5FF]/10 to-gray-900">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-[#00E5FF] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#00E5FF]/10 to-gray-900">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-red-400 text-xl">❌ {error || 'Profile not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#00E5FF]/10 to-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-[#00E5FF] to-[#1DE9B6] rounded-full flex items-center justify-center text-4xl font-bold text-black">
              {profile.username ? profile.username[0].toUpperCase() : formatAddress(address, 1)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-warm-white">
                  {profile.username || formatAddress(address, 8)}
                </h1>
                {profile.isVerified && (
                  <span className="text-blue-400 text-2xl" title="Verified">✓</span>
                )}
              </div>

              <p className="text-gray-400 mb-4">
                <code className="text-sm">{address}</code>
              </p>

              {profile.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex space-x-8">
                <div>
                  <p className="text-3xl font-bold text-[#00E5FF]">{formatNumber(profile.score)}</p>
                  <p className="text-sm text-gray-400">Reputation Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pink-400">#{profile.rank}</p>
                  <p className="text-sm text-gray-400">Global Rank</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-400">{formatNumber(profile.totalActions)}</p>
                  <p className="text-sm text-gray-400">Total Actions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reputation Score Card */}
          <div className="card">
            <h2 className="text-2xl font-bold text-warm-white mb-6">Reputation Breakdown</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300">Total Score</span>
                <span className="text-2xl font-bold text-warm-white">{formatNumber(profile.score)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300">Actions Received</span>
                <span className="text-xl font-semibold text-[#00E5FF]">{formatNumber(profile.totalActions)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300">Global Ranking</span>
                <span className="text-xl font-semibold text-pink-400">#{profile.rank}</span>
              </div>
            </div>

            {/* Progress to Next Milestone */}
            <div className="mt-6 p-4 bg-gradient-to-r from-[#00E5FF]/10 to-[#1DE9B6]/10 rounded-lg border border-[#00E5FF]/20">
              <p className="text-sm text-gray-400 mb-2">Progress to 1,000 points</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#00E5FF] to-[#1DE9B6] h-2 rounded-full"
                  style={{ width: `${Math.min((profile.score / 1000) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {profile.score >= 1000 ? 'Milestone reached! 🎉' : `${1000 - profile.score} points to go`}
              </p>
            </div>
          </div>

          {/* Recent Actions */}
          <div className="card">
            <h2 className="text-2xl font-bold text-warm-white mb-6">Recent Activity</h2>

            {actions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No recent actions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.slice(0, 10).map((action, index) => (
                  <div key={index} className="p-3 bg-gray-700/30 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-[#00E5FF]">
                        {action.actionType}
                      </span>
                      <span className={`text-sm font-semibold ${action.weight > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {action.weight > 0 ? '+' : ''}{action.weight}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>From: <code>{formatAddress(action.actor, 4)}</code></p>
                      <p className="mt-1">
                        {new Date(action.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold text-warm-white mb-6">Achievements</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Achievement badges based on score */}
            <div className={`p-4 rounded-lg text-center ${profile.score >= 100 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' : 'bg-gray-800/50 opacity-50'}`}>
              <div className="text-4xl mb-2">🥉</div>
              <p className="text-sm font-semibold text-warm-white">Bronze</p>
              <p className="text-xs text-gray-400">100+ points</p>
            </div>

            <div className={`p-4 rounded-lg text-center ${profile.score >= 500 ? 'bg-gradient-to-br from-gray-300/20 to-gray-400/20 border border-gray-300/30' : 'bg-gray-800/50 opacity-50'}`}>
              <div className="text-4xl mb-2">🥈</div>
              <p className="text-sm font-semibold text-warm-white">Silver</p>
              <p className="text-xs text-gray-400">500+ points</p>
            </div>

            <div className={`p-4 rounded-lg text-center ${profile.score >= 1000 ? 'bg-gradient-to-br from-yellow-300/20 to-yellow-500/20 border border-yellow-300/30' : 'bg-gray-800/50 opacity-50'}`}>
              <div className="text-4xl mb-2">🥇</div>
              <p className="text-sm font-semibold text-warm-white">Gold</p>
              <p className="text-xs text-gray-400">1,000+ points</p>
            </div>

            <div className={`p-4 rounded-lg text-center ${profile.rank <= 10 ? 'bg-gradient-to-br from-[#00E5FF]/20 to-[#1DE9B6]/20 border border-[#00E5FF]/30' : 'bg-gray-800/50 opacity-50'}`}>
              <div className="text-4xl mb-2">👑</div>
              <p className="text-sm font-semibold text-warm-white">Top 10</p>
              <p className="text-xs text-gray-400">Elite rank</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>Built for Monad Testnet • Powered by Parallel EVM</p>
        </div>
      </footer>
    </div>
  );
}
