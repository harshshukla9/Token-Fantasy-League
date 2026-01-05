'use client';

import Link from 'next/link';
import { CustomWalletButton } from './CustomWalletButton';
import { useAccount } from 'wagmi';

export function Navbar() {
  const { address } = useAccount();
  return (
    <div className="flex justify-center pt-6 px-4 relative z-0">
      <nav className="w-full max-w-6xl border border-gray-800 bg-[#121212] backdrop-blur-md rounded-full px-6 relative z-0">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xl font-bold text-warm-white hover:opacity-80 transition-all duration-200 hover:scale-105"
            >
              <img src="/logo.png" alt="Token Fantasy League Logo" className="w-8 h-8" />
              Token Fantasy League
            </Link>
            <Link 
              href={`/profile/${address}`} 
              className="text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 px-3 py-1.5 rounded-lg hover:bg-gray-800/50"
            >
              Profile
            </Link>
            <Link 
              href="/fantasy-points" 
              className="text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 px-3 py-1.5 rounded-lg hover:bg-gray-800/50"
            >
              Fantasy Points
            </Link>
          </div>

          <div className="flex items-center space-x-4 relative z-0">
            <CustomWalletButton />
          </div>
        </div>
      </nav>
    </div>
  );
}
