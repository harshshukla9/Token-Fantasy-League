'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { formatAddress, formatNumber, formatRelativeTime } from '@/shared';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Award, 
  Target, 
  Zap, 
  Crown, 
  Star,
  Copy,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Coins,
  BarChart3,
  Activity
} from 'lucide-react';

interface UserProfile {
  address: string;
  username?: string;
  bio?: string;
  isVerified: boolean;
  score: number;
  rank: number;
  totalActions: number;
  teamsJoined?: number;
  lobbiesParticipated?: number;
  totalWins?: number;
  totalEarnings?: number;
  joinDate?: string;
}

interface TeamHistory {
  id: string;
  lobbyName: string;
  teamPoints: number;
  rank: number;
  joinedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  earnings?: number;
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
  const [teamHistory, setTeamHistory] = useState<TeamHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Get team history from localStorage
        const storedTeams = JSON.parse(localStorage.getItem('fantasyTeams') || '[]');
        const userTeams = storedTeams.filter((team: any) => 
          team.userAddress?.toLowerCase() === address.toLowerCase()
        );

        // Simulate successful response with dummy data
        const data = {
          success: true,
          data: {
            address: address,
            username: 'CryptoMaster',
            bio: 'Passionate crypto trader and fantasy league enthusiast. Always looking for the next big move! 🚀',
            isVerified: true,
            score: 1250,
            rank: 42,
            totalActions: 156,
            teamsJoined: userTeams.length || 8,
            lobbiesParticipated: 12,
            totalWins: 3,
            totalEarnings: 1250.50,
            joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        };

        if (data.success) {
          setProfile(data.data);
          
          // Set team history
          const history: TeamHistory[] = userTeams.map((team: any, index: number) => ({
            id: team.lobbyId || `team-${index}`,
            lobbyName: team.lobbyName || `Lobby ${index + 1}`,
            teamPoints: Math.floor(Math.random() * 5000) + 1000,
            rank: Math.floor(Math.random() * 50) + 1,
            joinedAt: team.joinedAt || new Date().toISOString(),
            status: index < 2 ? 'active' : 'completed',
            earnings: index < 2 ? 0 : Math.random() * 500 + 50,
          }));
          setTeamHistory(history);

          // Set dummy actions
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
            },
            {
              actionType: 'BOOST',
              actor: '0x789...ghi',
              target: address,
              weight: 15,
              timestamp: Math.floor(Date.now() / 1000) - 10800,
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

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.mantlescan.xyz/tx/${txHash}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-20">
            <p className="text-red-400 text-xl">❌ {error || 'Profile not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  // Get first two letters for avatar
  const avatarText = profile.username 
    ? profile.username.slice(0, 2).toUpperCase() 
    : address.slice(2, 4).toUpperCase();

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="card mb-8 bg-gray-900 border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-5xl font-bold text-white border-2 border-gray-700">
                {avatarText}
              </div>
              {profile.isVerified && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border-4 border-black">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">
                      {profile.username || formatAddress(address, 8)}
                    </h1>
                    {profile.isVerified && (
                      <span className="text-white text-xl" title="Verified">
                        <CheckCircle2 className="w-6 h-6" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <code className="text-sm text-gray-400 font-mono">{address}</code>
                    <button
                      onClick={copyAddress}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors cursor-pointer"
                      title="Copy address"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <a
                      href={`https://sepolia.mantlescan.xyz/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>

                  {profile.bio && (
                    <p className="text-gray-300 mb-4 max-w-2xl">{profile.bio}</p>
                  )}

                  {profile.joinDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-white" />
                    <span className="text-sm text-gray-400">Score</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatNumber(profile.score)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="text-sm text-gray-400">Rank</span>
                  </div>
                  <p className="text-3xl font-bold text-white">#{profile.rank}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-white" />
                    <span className="text-sm text-gray-400">Teams</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{profile.teamsJoined || 0}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-white" />
                    <span className="text-sm text-gray-400">Earnings</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {profile.totalEarnings ? `$${formatNumber(profile.totalEarnings)}` : '$0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Overview */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-white" />
                  Performance Overview
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Lobbies</p>
                  <p className="text-2xl font-bold text-white">{profile.lobbiesParticipated || 0}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Wins</p>
                  <p className="text-2xl font-bold text-white">{profile.totalWins || 0}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {profile.lobbiesParticipated 
                      ? `${Math.round(((profile.totalWins || 0) / profile.lobbiesParticipated) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Actions</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(profile.totalActions)}</p>
                </div>
              </div>

              {/* Progress to Next Milestone */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-300 font-semibold">Progress to 2,000 points</p>
                  <p className="text-sm text-white font-bold">
                    {profile.score >= 2000 ? '100%' : `${Math.round((profile.score / 2000) * 100)}%`}
                  </p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((profile.score / 2000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {profile.score >= 2000 
                    ? '🎉 Milestone reached! Keep going!' 
                    : `${formatNumber(2000 - profile.score)} points to go`}
                </p>
              </div>
            </div>

            {/* Team History */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-white" />
                  Team History
                </h2>
              </div>

              {teamHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No teams joined yet</p>
                  <p className="text-sm text-gray-500 mt-2">Join a lobby to start competing!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamHistory.map((team) => (
                    <div
                      key={team.id}
                      className={`p-4 rounded-lg border transition-all ${
                        team.status === 'active'
                          ? 'bg-gray-800/50 border-gray-600'
                          : team.status === 'completed'
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-900/50 border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{team.lobbyName}</h3>
                            {team.status === 'active' && (
                              <span className="px-2 py-0.5 bg-gray-700 text-white text-xs rounded-full border border-gray-600">
                                Active
                              </span>
                            )}
                            {team.status === 'completed' && (
                              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-600">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(team.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-4 h-4 text-white" />
                            <span className="text-lg font-bold text-white">#{team.rank}</span>
                          </div>
                          <p className="text-sm text-gray-400">{formatNumber(team.teamPoints)} pts</p>
                          {team.earnings && team.earnings > 0 && (
                            <p className="text-sm text-white font-semibold mt-1">
                              +${team.earnings.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-white" />
                Recent Activity
              </h2>

              {actions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700">
                            <TrendingUp className={`w-5 h-5 ${action.weight > 0 ? 'text-white' : 'text-gray-400 rotate-180'}`} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white">
                              {action.actionType}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">
                              From: <code className="text-white">{formatAddress(action.actor, 4)}</code>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">
                            {action.weight > 0 ? '+' : ''}{action.weight}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(action.timestamp)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={getExplorerUrl(action.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mt-2"
                      >
                        View Transaction <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Achievements */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-white" />
                Achievements
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg text-center transition-all ${
                  profile.score >= 100 
                    ? 'bg-gray-800 border-2 border-gray-600' 
                    : 'bg-gray-800/50 border border-gray-700 opacity-50'
                }`}>
                  <div className="text-4xl mb-2">🥉</div>
                  <p className="text-sm font-semibold text-white">Bronze</p>
                  <p className="text-xs text-gray-400">100+ points</p>
                  {profile.score >= 100 && (
                    <CheckCircle2 className="w-5 h-5 text-white mx-auto mt-2" />
                  )}
                </div>

                <div className={`p-4 rounded-lg text-center transition-all ${
                  profile.score >= 500 
                    ? 'bg-gray-800 border-2 border-gray-600' 
                    : 'bg-gray-800/50 border border-gray-700 opacity-50'
                }`}>
                  <div className="text-4xl mb-2">🥈</div>
                  <p className="text-sm font-semibold text-white">Silver</p>
                  <p className="text-xs text-gray-400">500+ points</p>
                  {profile.score >= 500 && (
                    <CheckCircle2 className="w-5 h-5 text-white mx-auto mt-2" />
                  )}
                </div>

                <div className={`p-4 rounded-lg text-center transition-all ${
                  profile.score >= 1000 
                    ? 'bg-gray-800 border-2 border-gray-600' 
                    : 'bg-gray-800/50 border border-gray-700 opacity-50'
                }`}>
                  <div className="text-4xl mb-2">🥇</div>
                  <p className="text-sm font-semibold text-white">Gold</p>
                  <p className="text-xs text-gray-400">1,000+ points</p>
                  {profile.score >= 1000 && (
                    <CheckCircle2 className="w-5 h-5 text-white mx-auto mt-2" />
                  )}
                </div>

                <div className={`p-4 rounded-lg text-center transition-all ${
                  profile.rank <= 10 
                    ? 'bg-gray-800 border-2 border-gray-600' 
                    : 'bg-gray-800/50 border border-gray-700 opacity-50'
                }`}>
                  <div className="text-4xl mb-2">👑</div>
                  <p className="text-sm font-semibold text-white">Top 10</p>
                  <p className="text-xs text-gray-400">Elite rank</p>
                  {profile.rank <= 10 && (
                    <CheckCircle2 className="w-5 h-5 text-white mx-auto mt-2" />
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Best Rank</span>
                  <span className="text-white font-semibold">#{profile.rank}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total Earnings</span>
                  <span className="text-white font-semibold">
                    ${profile.totalEarnings?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Active Teams</span>
                  <span className="text-white font-semibold">
                    {teamHistory.filter(t => t.status === 'active').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>Token Premier League • Powered by Mantle Network</p>
        </div>
      </footer>
    </div>
  );
}
