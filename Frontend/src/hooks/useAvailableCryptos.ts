import { useCryptoPrices } from './useCryptoPrices';

// Map of crypto IDs to Binance symbols
export const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  btc: 'BTCUSDT',
  eth: 'ETHUSDT',
  bnb: 'BNBUSDT',
  sol: 'SOLUSDT',
  ada: 'ADAUSDT',
  xrp: 'XRPUSDT',
  dot: 'DOTUSDT',
  matic: 'MATICUSDT',
  avax: 'AVAXUSDT',
  link: 'LINKUSDT',
  ltc: 'LTCUSDT',
  atom: 'ATOMUSDT',
  algo: 'ALGOUSDT',
  vet: 'VETUSDT',
  icp: 'ICPUSDT',
};

// Reverse map: Binance symbol to crypto ID
export const SYMBOL_TO_ID_MAP: Record<string, string> = Object.entries(
  CRYPTO_SYMBOL_MAP
).reduce((acc, [id, symbol]) => {
  acc[symbol] = id;
  return acc;
}, {} as Record<string, string>);

export interface AvailableCrypto {
  id: string;
  symbol: string;
  name: string;
  binanceSymbol: string;
  price: number | null;
  priceString: string | null;
  change24h?: number; // Can be fetched separately if needed
  logo?: string;
}

// Default crypto list with metadata - Using CoinGecko for more reliable logo URLs
export const AVAILABLE_CRYPTOS: Omit<AvailableCrypto, 'price' | 'priceString'>[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', binanceSymbol: 'BTCUSDT', logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', binanceSymbol: 'ETHUSDT', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', binanceSymbol: 'BNBUSDT', logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', binanceSymbol: 'SOLUSDT', logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', binanceSymbol: 'ADAUSDT', logo: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', binanceSymbol: 'XRPUSDT', logo: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', binanceSymbol: 'DOTUSDT', logo: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', binanceSymbol: 'MATICUSDT', logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', binanceSymbol: 'AVAXUSDT', logo: 'https://assets.coingecko.com/coins/images/12559/large/avalanche-avax-logo.png' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', binanceSymbol: 'LINKUSDT', logo: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
  { id: 'ltc', symbol: 'LTC', name: 'Litecoin', binanceSymbol: 'LTCUSDT', logo: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png' },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', binanceSymbol: 'ATOMUSDT', logo: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png' },
  { id: 'algo', symbol: 'ALGO', name: 'Algorand', binanceSymbol: 'ALGOUSDT', logo: 'https://assets.coingecko.com/coins/images/4380/large/download.png' },
  { id: 'vet', symbol: 'VET', name: 'VeChain', binanceSymbol: 'VETUSDT', logo: 'https://assets.coingecko.com/coins/images/1167/large/Vechain.png' },
  { id: 'icp', symbol: 'ICP', name: 'Internet Computer', binanceSymbol: 'ICPUSDT', logo: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png' },
];

export function useAvailableCryptos(options?: { interval?: number; enabled?: boolean }) {
  // Get all Binance symbols
  const symbols = AVAILABLE_CRYPTOS.map((crypto) => crypto.binanceSymbol);

  // Fetch prices
  const { prices, loading, error, getPrice, getPriceNumber, refetch } = useCryptoPrices({
    symbols,
    interval: options?.interval || 5000,
    enabled: options?.enabled !== false,
  });

  // Combine crypto metadata with real-time prices
  const cryptosWithPrices: AvailableCrypto[] = AVAILABLE_CRYPTOS.map((crypto) => {
    const priceData = getPrice(crypto.binanceSymbol);
    return {
      ...crypto,
      price: priceData?.priceNumber || null,
      priceString: priceData?.price || null,
    };
  });

  return {
    cryptos: cryptosWithPrices,
    loading,
    error,
    refetch,
    getPrice: (id: string) => {
      const crypto = AVAILABLE_CRYPTOS.find((c) => c.id === id);
      if (!crypto) return null;
      return getPrice(crypto.binanceSymbol);
    },
    getPriceNumber: (id: string) => {
      const crypto = AVAILABLE_CRYPTOS.find((c) => c.id === id);
      if (!crypto) return null;
      return getPriceNumber(crypto.binanceSymbol);
    },
  };
}

