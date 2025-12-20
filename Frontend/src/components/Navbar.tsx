'use client';

import Link from 'next/link';
import { CustomWalletButton } from './CustomWalletButton';

export function Navbar() {
  return (
    <div className="flex justify-center pt-6 px-4 relative z-[999998]">
      <nav className="w-full max-w-3xl border border-gray-800 bg-[#121212] backdrop-blur-md rounded-full px-6 relative z-[999998]">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-warm-white">
              <img src="/logo.png" alt="Crypto Fantasy League Logo" className="w-8 h-8" />
              Crypto Fantasy League
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center space-x-4 relative z-[999999]">
            <CustomWalletButton />
          </div>
        </div>
      </nav>
    </div>
  );
}
