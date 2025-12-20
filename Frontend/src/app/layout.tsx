import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

import TargetCursor from '@/components/TargetCursor';
import { LoadingAnimation } from '@/components/LoadingAnimation';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Crypto Fantasy League - Dream11-style Fantasy Gaming with Cryptocurrencies',
  description: 'Create your fantasy team of 8 cryptocurrencies. Choose Captain (2×) and Vice-Captain (1.5×). Earn points based on real-time crypto price movements and compete on leaderboards.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={spaceGrotesk.className}>
        <LoadingAnimation />
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor={true}
          parallaxOn={true}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
