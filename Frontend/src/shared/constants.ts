export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  name: 'Monad Testnet',
  rpcUrl: 'https://testnet.monad.xyz',
  wsUrl: 'wss://testnet.monad.xyz',
  blockExplorer: 'https://explorer.testnet.monad.xyz',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
};

export const ACTION_TYPES = {
  FOLLOW: 0,
  LIKE: 1,
  BOOST: 2,
  VERIFY: 3,
  COMMENT: 4,
  SHARE: 5,
  REPORT: 6,
} as const;

export type ActionTypeValue = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

export const ACTION_WEIGHTS: Record<ActionTypeValue, number> = {
  [ACTION_TYPES.FOLLOW]: 10,
  [ACTION_TYPES.LIKE]: 5,
  [ACTION_TYPES.BOOST]: 15,
  [ACTION_TYPES.VERIFY]: 25,
  [ACTION_TYPES.COMMENT]: 8,
  [ACTION_TYPES.SHARE]: 12,
  [ACTION_TYPES.REPORT]: -20,
};

export const ACTION_LABELS: Record<ActionTypeValue, string> = {
  [ACTION_TYPES.FOLLOW]: 'Follow',
  [ACTION_TYPES.LIKE]: 'Like',
  [ACTION_TYPES.BOOST]: 'Boost',
  [ACTION_TYPES.VERIFY]: 'Verify',
  [ACTION_TYPES.COMMENT]: 'Comment',
  [ACTION_TYPES.SHARE]: 'Share',
  [ACTION_TYPES.REPORT]: 'Report',
};

export const CONTRACT_ADDRESSES = {
  REPUTATION_CORE: process.env.NEXT_PUBLIC_REPUTATION_CORE_ADDRESS || '0xd73D8c7875D7C4887B584d1e8C9EA02Ea1db7Df5',
  REPUTATION_ACTIONS: process.env.NEXT_PUBLIC_REPUTATION_ACTIONS_ADDRESS || '0x5Cbc2D26e76D85115F732d7174D73252982b9C50',
  REPUTATION_REGISTRY: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS || '',
  CFL: process.env.NEXT_PUBLIC_CFL_ADDRESS || '0x82CF8d42205f0bdC6A5d3Efcd2b9ca84B3E548AB',
  DEPOSIT: process.env.NEXT_PUBLIC_DEPOST_ADDRESS || '0x320E6049a8806295aF8Dd6F1D6Df708474059825',
};
