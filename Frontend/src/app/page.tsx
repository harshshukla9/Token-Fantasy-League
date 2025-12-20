import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import CircularText from '@/components/CircularText';
import Squares from '@/components/Squares';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col relative overflow-hidden">
      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={40}
          direction='diagonal'
          borderColor='#00E5FF22'
          hoverFillColor='#222'
        />
      </div>

      <div className="absolute top-24 right-8 z-50 scale-[1.75] origin-center">
        <CircularText
          text="CRYPTO * FANTASY * LEAGUE * DREAM11 * STYLE *"
          onHover="speedUp"
          spinDuration={20}
          className="custom-class"
        />
      </div>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 animate-fade-in-up">
            <div className="relative flex items-center justify-center">
              <h1 className="text-7xl font-bold text-white pb-2">
                Crypto Fantasy League
              </h1>
            </div>
            <p className="text-2xl text-gray-300 font-light tracking-wide">
              Dream11-style fantasy gaming with cryptocurrencies
            </p>
          </div>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Create your fantasy team of 8 cryptocurrencies. Choose your Captain (2× points) and Vice-Captain (1.5× points). 
            Earn points based on real-time crypto price movements and compete on leaderboards.
          </p>

          <div className="flex flex-col items-center gap-8 pt-8 animate-fade-in-up delay-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/dashboard"
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-gray-200"
              >
                <span className="relative flex items-center gap-2">
                  Launch App
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="group px-8 py-4 bg-gray-800 border border-gray-600 text-white font-semibold rounded-full transition-all hover:bg-gray-700 hover:border-gray-500 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  View Leaderboard
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>Crypto Fantasy League • Transform passive crypto watching into competitive gaming</p>
        </div>
      </footer>
    </div>
  );
}
