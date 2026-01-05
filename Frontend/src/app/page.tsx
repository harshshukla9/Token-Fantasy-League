'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import CircularText from '@/components/CircularText';
import Squares from '@/components/Squares';
import { Trophy, Users, TrendingUp, Zap, Shield, Coins, ArrowRight, Star, Award, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] relative overflow-x-hidden">

      <div className="fixed inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={40}
          direction='diagonal'
          borderColor='#00E5FF22'
          hoverFillColor='#222'
        />
      </div>


      {/* Navbar */}
      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
          <div className="space-y-6">
            <div className="relative flex items-center justify-center">
              <h1 className="text-7xl md:text-8xl font-bold text-white pb-2">
                Token Premier League
              </h1>
            </div>
            <p className="text-3xl md:text-4xl text-gray-300 font-light tracking-wide">
              Fantasy Crypto Gaming on Blockchain
            </p>
          </div>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Create your fantasy team of cryptocurrencies. Choose your Captain and Vice-Captain. 
            Earn points based on real-time crypto price movements and compete for prizes on the blockchain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link
              href="/lobbies"
              className="group relative px-10 py-5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-gray-200 text-lg"
            >
              <span className="relative flex items-center gap-2">
                Launch App
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/lobbies"
              className="group px-10 py-5 bg-gray-800 border border-gray-600 text-white font-semibold rounded-full transition-all hover:bg-gray-700 hover:border-gray-500 hover:scale-105 text-lg"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                View Contests
              </span>
            </Link>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">$500K+</div>
              <div className="text-sm text-gray-400">Total Prizes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-sm text-gray-400">Cryptocurrencies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-gray-400">Live Trading</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-4">Why Token Premier League?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of fantasy gaming with blockchain technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card hover:border-gray-600 transition-all group">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-colors">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-Time Prices</h3>
              <p className="text-gray-400 leading-relaxed">
                Track live cryptocurrency prices and make strategic decisions based on real market data.
              </p>
            </div>

            <div className="card hover:border-gray-600 transition-all group">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-colors">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Competitive Prizes</h3>
              <p className="text-gray-400 leading-relaxed">
                Compete for real prizes and climb the leaderboard. Top performers win crypto rewards.
              </p>
            </div>

            <div className="card hover:border-gray-600 transition-all group">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-colors">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Blockchain Secured</h3>
              <p className="text-gray-400 leading-relaxed">
                All transactions and scores are recorded on-chain for transparency and security.
              </p>
            </div>

            <div className="card hover:border-gray-600 transition-all group">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-colors">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Instant Updates</h3>
              <p className="text-gray-400 leading-relaxed">
                Get real-time score updates and leaderboard changes as prices move.
              </p>
            </div>

            <div className="card hover:border-gray-600 transition-all group">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-colors">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Global Community</h3>
              <p className="text-gray-400 leading-relaxed">
                Join thousands of players worldwide competing in daily and weekly leagues.
              </p>
            </div>

            <div className="card hover:border-gray-600 transition-all group">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-colors">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Strategic Gameplay</h3>
              <p className="text-gray-400 leading-relaxed">
                Choose your Captain (2×) and Vice-Captain (1.5×) to maximize your points.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-32 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6 border-2 border-gray-700">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Connect Wallet</h3>
              <p className="text-gray-400 leading-relaxed">
                Connect your wallet to the Mantle network and get ready to play.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6 border-2 border-gray-700">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Create Team</h3>
              <p className="text-gray-400 leading-relaxed">
                Select 6 cryptocurrencies, choose your Captain and Vice-Captain, and join a lobby.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6 border-2 border-gray-700">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Compete & Win</h3>
              <p className="text-gray-400 leading-relaxed">
                Earn points as prices move and compete for the top spot on the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-4">Top Performers</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See who's leading the competition
            </p>
          </div>

          <div className="card max-w-3xl mx-auto">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div
                  key={rank}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {rank === 1 ? <Trophy className="w-5 h-5" /> :
                       rank === 2 ? <Award className="w-5 h-5" /> :
                       rank === 3 ? <Star className="w-5 h-5" /> : rank}
                    </div>
                    <div>
                      <div className="text-white font-semibold">Player {rank}</div>
                      <div className="text-sm text-gray-400">0x{Math.random().toString(16).slice(2, 10)}...</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">{Math.floor(Math.random() * 10000) + 5000} pts</div>
                    <div className="text-sm text-green-400">+{Math.floor(Math.random() * 500) + 100}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/lobbies"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-lg transition-colors"
              >
                View Full Leaderboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Token Premier League Logo" className="w-8 h-8" />
                <span className="text-xl font-bold text-white">Token Premier League</span>
              </div>
              <p className="text-gray-400 text-sm">
                Fantasy crypto gaming on the blockchain. Compete, earn, and win.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/lobbies" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Lobbies
                  </Link>
                </li>
                <li>
                  <Link href="/lobbies" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/book-demo" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Book Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Network</h4>
              <p className="text-gray-400 text-sm mb-2">Powered by Mantle Network</p>
              <p className="text-gray-500 text-xs">Mantle Sepolia Testnet</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>Token Premier League • Transform passive crypto watching into competitive gaming</p>
            <p className="mt-2">© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
