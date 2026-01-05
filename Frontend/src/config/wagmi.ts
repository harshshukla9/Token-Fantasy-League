import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, createStorage, cookieStorage } from 'wagmi';
import { defineChain } from 'viem';

export const mantleTestnet = defineChain({
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: process.env.NEXT_PUBLIC_MANTLE_EXPLORER || 'https://sepolia.mantlescan.xyz',
    },
  },
  testnet: true,
});

export const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: process.env.NEXT_PUBLIC_MANTLE_EXPLORER || 'https://mantlescan.xyz',
    },
  },
  testnet: false,
});

export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Crypto Fantasy League',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mantleTestnet, mantleMainnet],
  transports: {
    [mantleTestnet.id]: http(),
    [mantleMainnet.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
