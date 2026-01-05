'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeft, Crown, Star, Check, Clock, Trophy, Coins } from 'lucide-react';
import { useAccount } from '@/wallet-connect';
import { parseEther } from 'viem';
import { useDepositWithStatus } from '@/hooks/useCFL';
import { formatDateTime, formatDuration, calculateEndTime, simulateCurrentPrice } from '@/shared/utils';
import { Lobby } from '@/components/LobbiesList';

export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  logo?: string;
}

const availableCryptos: Cryptocurrency[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 88150, change24h: 2.5, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 2977.8, change24h: 1.8, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', price: 851.85, change24h: -0.5, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 126.10, change24h: 5.2, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2087.png' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.38, change24h: 1.2, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', price: 1.95, change24h: -1.1, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png' },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 1.85, change24h: 3.4, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png' },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', price: 0.85, change24h: 2.1, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 12.32, change24h: 4.3, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', price: 13.5, change24h: 1.5, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png' },
  { id: 'ltc', symbol: 'LTC', name: 'Litecoin', price: 79, change24h: -0.8, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2.png' },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', price: 1.98, change24h: 2.7, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3794.png' },
  { id: 'algo', symbol: 'ALGO', name: 'Algorand', price: 0.115, change24h: 1.9, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4030.png' },
  { id: 'vet', symbol: 'VET', name: 'VeChain', price: 0.0107, change24h: 0.6, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3077.png' },
  { id: 'icp', symbol: 'ICP', name: 'Internet Computer', price: 2.96, change24h: -2.1, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8916.png' },
];

function TokenFieldCard({ 
  crypto, 
  isCaptain, 
  isViceCaptain,
  position 
}: { 
  crypto: Cryptocurrency & { currentPrice?: number }; 
  isCaptain: boolean; 
  isViceCaptain: boolean;
  position: number;
}) {
  const avatarText = crypto.symbol.slice(0, 2).toUpperCase();
  
  return (
    <div className={`relative w-24 h-28 rounded-xl border-2 transition-all hover:scale-105 ${
      isCaptain 
        ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-yellow-500/20 shadow-lg shadow-yellow-400/40' 
        : isViceCaptain
          ? 'border-gray-400 bg-gradient-to-br from-gray-400/30 to-gray-500/20 shadow-lg shadow-gray-400/40'
          : 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-green-600/10'
    }`}>
      {(isCaptain || isViceCaptain) && (
        <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
          isCaptain 
            ? 'bg-yellow-400 text-black border-2 border-yellow-300' 
            : 'bg-gray-400 text-black border-2 border-gray-300'
        }`}>
          {isCaptain ? 'C' : 'VC'}
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center h-full p-2">
        {crypto.logo ? (
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 overflow-hidden bg-gray-800 border-2 border-gray-700">
            <img 
              src={crypto.logo} 
              alt={crypto.symbol}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `<span class="text-xs font-bold text-white">${avatarText}</span>`;
                }
              }}
            />
          </div>
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 font-bold text-sm ${
            isCaptain 
              ? 'bg-yellow-400/30 text-yellow-200 border-2 border-yellow-400/50' 
              : isViceCaptain
                ? 'bg-gray-400/30 text-gray-200 border-2 border-gray-400/50'
                : 'bg-green-500/30 text-green-200 border-2 border-green-500/50'
          }`}>
            {avatarText}
          </div>
        )}
        
        <div className="text-sm font-bold text-white mb-1">
          {crypto.symbol}
        </div>
        
        <div className="text-[10px] text-gray-300 text-center leading-tight">
          ${crypto.currentPrice ? crypto.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : crypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}

export default function JoinLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId as string;
  const { address, isConnected } = useAccount();
  const { deposit, isPending, isConfirming, isSuccess, error } = useDepositWithStatus();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [viceCaptain, setViceCaptain] = useState<string | null>(null);
  const [priceUpdateTime, setPriceUpdateTime] = useState(Date.now());

  // Fetch lobby data
  useEffect(() => {
    // Mock lobby data - in real app, fetch from API
    const mockLobbies: Lobby[] = [
      {
        id: '1',
        name: 'Premium League - Week 1',
        depositAmount: 5,
        currentParticipants: 45,
        maxParticipants: 50,
        numberOfCoins: 8,
        prizePool: 225,
        status: 'open',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        interval: 7 * 24 * 60 * 60,
      },
      {
        id: '2',
        name: 'Standard League - Week 1',
        depositAmount: 4,
        currentParticipants: 32,
        maxParticipants: 100,
        numberOfCoins: 8,
        prizePool: 128,
        status: 'open',
        startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
        interval: 7 * 24 * 60 * 60,
      },
      {
        id: '3',
        name: 'Beginner League - Week 1',
        depositAmount: 2,
        currentParticipants: 78,
        maxParticipants: 100,
        numberOfCoins: 8,
        prizePool: 156,
        status: 'open',
        startTime: new Date(Date.now() + 30 * 60 * 1000),
        interval: 3 * 24 * 60 * 60,
      },
    ];

    const foundLobby = mockLobbies.find(l => l.id === lobbyId);
    if (foundLobby) {
      setLobby(foundLobby);
    }
  }, [lobbyId]);

  // Update prices every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceUpdateTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current prices
  const currentPrices = useMemo(() => {
    const baseTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return availableCryptos.map(crypto => ({
      ...crypto,
      currentPrice: simulateCurrentPrice(crypto.price, crypto.change24h, baseTimestamp, 0.04),
    }));
  }, [priceUpdateTime]);

  // Handle deposit success
  useEffect(() => {
    if (isSuccess && lobby) {
      const teamData = {
        lobbyId: lobby.id,
        lobbyName: lobby.name,
        entryFee: lobby.depositAmount,
        userAddress: address || '',
        selectedCryptos: selectedCryptos.map((cryptoId) => {
          const crypto = availableCryptos.find((c) => c.id === cryptoId);
          return {
            id: cryptoId,
            symbol: crypto?.symbol || '',
            name: crypto?.name || '',
            initialPrice: crypto?.price || 0,
            initialChange24h: crypto?.change24h || 0,
            isCaptain: cryptoId === captain,
            isViceCaptain: cryptoId === viceCaptain,
          };
        }),
        captain: captain || '',
        viceCaptain: viceCaptain || '',
        joinedAt: new Date().toISOString(),
      };

      try {
        const existingTeams = JSON.parse(localStorage.getItem('fantasyTeams') || '[]');
        existingTeams.push(teamData);
        localStorage.setItem('fantasyTeams', JSON.stringify(existingTeams));
        
        const allCoinPrices = availableCryptos.map((crypto) => ({
          id: crypto.id,
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.price,
          change24h: crypto.change24h,
          timestamp: new Date().toISOString(),
        }));
        localStorage.setItem('coinInitialPrices', JSON.stringify(allCoinPrices));
      } catch (error) {
        console.error('Failed to save team to localStorage:', error);
      }

      // Navigate to lobby page
      setTimeout(() => {
        router.push(`/lobby/${lobbyId}`);
      }, 500);
    }
  }, [isSuccess, lobby, selectedCryptos, captain, viceCaptain, address, lobbyId, router]);

  const requiredCoins = lobby?.numberOfCoins || 6;

  const handleCryptoSelect = (cryptoId: string) => {
    if (selectedCryptos.includes(cryptoId)) {
      setSelectedCryptos(selectedCryptos.filter((id) => id !== cryptoId));
      if (captain === cryptoId) setCaptain(null);
      if (viceCaptain === cryptoId) setViceCaptain(null);
    } else {
      if (selectedCryptos.length < requiredCoins) {
        setSelectedCryptos([...selectedCryptos, cryptoId]);
      }
    }
  };

  const handleSetCaptain = (cryptoId: string) => {
    if (!selectedCryptos.includes(cryptoId)) return;
    if (viceCaptain === cryptoId) setViceCaptain(null);
    setCaptain(captain === cryptoId ? null : cryptoId);
  };

  const handleSetViceCaptain = (cryptoId: string) => {
    if (!selectedCryptos.includes(cryptoId)) return;
    if (captain === cryptoId) setCaptain(null);
    setViceCaptain(viceCaptain === cryptoId ? null : cryptoId);
  };

  const handleConfirm = () => {
    const requiredCoins = lobby?.numberOfCoins || 6;
    if (selectedCryptos.length !== requiredCoins) {
      alert(`Please select exactly ${requiredCoins} cryptocurrencies`);
      return;
    }
    if (!captain) {
      alert('Please select a Captain');
      return;
    }
    if (!viceCaptain) {
      alert('Please select a Vice-Captain');
      return;
    }
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    if (!lobby) return;

    try {
      const depositAmount = parseEther(lobby.depositAmount.toString());
      deposit(depositAmount);
    } catch (error: any) {
      console.error('Failed to parse deposit amount:', error);
      alert(`Invalid deposit amount: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const getCrypto = (id: string) => currentPrices.find((c) => c.id === id) || availableCryptos.find((c) => c.id === id);

  const generatePriceData = (basePrice: number, change24h: number) => {
    const points = 20;
    const data: number[] = [];
    const trend = change24h > 0 ? 1 : -1;
    
    for (let i = 0; i < points; i++) {
      const variation = (Math.random() - 0.5) * 0.1;
      const trendFactor = (i / points) * (change24h / 100) * trend;
      const price = basePrice * (1 + variation + trendFactor);
      data.push(price);
    }
    
    return data;
  };

  const renderMiniGraph = (priceData: number[], isPositive: boolean) => {
    if (priceData.length === 0) return null;
    
    const width = 100;
    const height = 30;
    const padding = 2;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const priceRange = maxPrice - minPrice || 1;
    
    const points = priceData.map((price, index) => {
      const x = padding + (index / (priceData.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((price - minPrice) / priceRange) * graphHeight;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} className="w-full h-8">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#00E5FF' : '#ff4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const teamStats = useMemo(() => {
    return {
      selected: selectedCryptos.length,
      total: lobby?.numberOfCoins || 6,
      captain: captain ? getCrypto(captain)?.symbol : null,
      viceCaptain: viceCaptain ? getCrypto(viceCaptain)?.symbol : null,
    };
  }, [selectedCryptos.length, captain, viceCaptain, lobby?.numberOfCoins]);

  if (!lobby) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-20">
            <p className="text-red-400 text-xl">Lobby not found</p>
            <button
              onClick={() => router.push('/lobbies')}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <ProtectedRoute>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/lobbies')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lobbies
            </button>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{lobby.name}</h1>
                  <p className="text-sm text-gray-400">
                    Entry Fee: <span className="text-white font-semibold">{lobby.depositAmount} tokens</span>
                  </p>
                  {lobby.startTime && lobby.interval && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        Duration: <span className="text-white">{formatDuration(lobby.interval)}</span>
                      </span>
                      <span className="text-gray-500">•</span>
                      <span>
                        Starts: <span className="text-white">{formatDateTime(lobby.startTime)}</span>
                      </span>
                      <span className="text-gray-500">•</span>
                      <span>
                        Ends: <span className="text-white">{formatDateTime(calculateEndTime(lobby.startTime, lobby.interval))}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content - Split Layout */}
          <div className="card flex flex-col lg:flex-row overflow-hidden p-0">
            {/* Left Side - Token Selection */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide border-r border-gray-800 max-h-[calc(100vh-300px)]">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="font-semibold text-white">Select {lobby?.numberOfCoins || 6} cryptocurrencies</span> for your fantasy team
                </p>
                <p className="text-sm text-gray-400">
                  Choose <span className="font-semibold text-white">1 Captain (2× points)</span> and{' '}
                  <span className="font-semibold text-white">1 Vice-Captain (1.5× points)</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: <span className="text-white font-semibold">{selectedCryptos.length}/{lobby?.numberOfCoins || 6}</span>
                </p>
              </div>

              {/* Selected Team Section */}
              {selectedCryptos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Your Team ({selectedCryptos.length}/{lobby?.numberOfCoins || 6})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedCryptos.map((cryptoId) => {
                      const crypto = getCrypto(cryptoId);
                      if (!crypto) return null;
                      const isCap = captain === cryptoId;
                      const isVC = viceCaptain === cryptoId;

                      return (
                        <div
                          key={cryptoId}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isCap
                              ? 'border-white bg-white/10'
                              : isVC
                                ? 'border-gray-400 bg-gray-400/10'
                                : 'border-gray-700 bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {crypto.logo && (
                                <img 
                                  src={crypto.logo} 
                                  alt={crypto.symbol}
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="text-sm font-bold text-white">{crypto.symbol}</span>
                            </div>
                            {isCap && <Crown className="h-4 w-4 text-white" />}
                            {isVC && <Star className="h-4 w-4 text-gray-400" />}
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{crypto.name}</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSetCaptain(cryptoId)}
                              className={`flex-1 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                                isCap
                                  ? 'bg-white text-black font-semibold'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              C
                            </button>
                            <button
                              onClick={() => handleSetViceCaptain(cryptoId)}
                              className={`flex-1 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                                isVC
                                  ? 'bg-gray-400 text-black font-semibold'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              VC
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Cryptocurrencies */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Available Cryptocurrencies</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {currentPrices.map((crypto) => {
                    const isSelected = selectedCryptos.includes(crypto.id);
                    const isCap = captain === crypto.id;
                    const isVC = viceCaptain === crypto.id;
                    const requiredCoins = lobby?.numberOfCoins || 6;
                    const canSelect = selectedCryptos.length < requiredCoins || isSelected;

                    return (
                      <button
                        key={crypto.id}
                        onClick={() => handleCryptoSelect(crypto.id)}
                        disabled={!canSelect}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? isCap
                              ? 'border-white bg-white/10 cursor-pointer'
                              : isVC
                                ? 'border-gray-400 bg-gray-400/10 cursor-pointer'
                                : 'border-white bg-white/5 cursor-pointer'
                            : canSelect
                              ? 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750 cursor-pointer'
                              : 'border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {crypto.logo && (
                              <img 
                                src={crypto.logo} 
                                alt={crypto.symbol}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-sm font-bold text-white">{crypto.symbol}</span>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center">
                              <Check className="h-3 w-3 text-black" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{crypto.name}</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">${crypto.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          <span
                            className={`text-xs font-semibold ${
                              crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {crypto.change24h >= 0 ? '+' : ''}
                            {crypto.change24h.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 mb-2">
                          {renderMiniGraph(generatePriceData(crypto.currentPrice, crypto.change24h), crypto.change24h >= 0)}
                        </div>
                        {isCap && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-white">
                            <Crown className="h-3 w-3" />
                            <span>Captain (2×)</span>
                          </div>
                        )}
                        {isVC && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                            <Star className="h-3 w-3" />
                            <span>Vice-Captain (1.5×)</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - Team Field Map */}
            <div className="w-full lg:w-96 bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border-t lg:border-t-0 lg:border-l border-gray-800 relative overflow-hidden">
              {/* Field Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 8px,
                    rgba(34, 197, 94, 0.15) 8px,
                    rgba(34, 197, 94, 0.15) 16px
                  )`,
                }} />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-500/30 transform -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border-2 border-green-500/20 transform -translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* Team Stats Header */}
              <div className="relative z-10 p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">
                    Players {teamStats.selected}/{teamStats.total}
                  </span>
                  <span className="text-xs text-gray-400">
                    {selectedCryptos.length > 0 ? `${selectedCryptos.length} Selected` : 'No Selection'}
                  </span>
                </div>
                {captain && viceCaptain && (
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-400" />
                      <span className="text-gray-300">C: {teamStats.captain}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">VC: {teamStats.viceCaptain}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Field Map */}
              <div className="relative z-10 h-full p-6 flex flex-col items-center justify-center min-h-[400px]">
                {selectedCryptos.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-12 h-12 text-gray-600" />
                    </div>
                    <p className="text-sm">Select tokens to see them on the field</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center space-y-4">
                    {(() => {
                      const requiredCoins = lobby?.numberOfCoins || 6;
                      const rows = Math.ceil(requiredCoins / 3); // 3 tokens per row max
                      const tokensPerRow = Math.ceil(requiredCoins / rows);
                      
                      return Array.from({ length: rows }).map((_, rowIndex) => {
                        const startIndex = rowIndex * tokensPerRow;
                        const endIndex = Math.min(startIndex + tokensPerRow, requiredCoins);
                        const rowTokens = selectedCryptos.slice(startIndex, endIndex);
                        const emptySlots = tokensPerRow - rowTokens.length;
                        
                        return (
                          <div key={rowIndex} className="flex items-center justify-center gap-4 w-full flex-wrap">
                            {rowTokens.map((cryptoId, index) => {
                              const crypto = getCrypto(cryptoId);
                              if (!crypto) return null;
                              const isCap = captain === cryptoId;
                              const isVC = viceCaptain === cryptoId;
                              return (
                                <TokenFieldCard
                                  key={cryptoId}
                                  crypto={crypto}
                                  isCaptain={isCap}
                                  isViceCaptain={isVC}
                                  position={startIndex + index + 1}
                                />
                              );
                            })}
                            {Array.from({ length: emptySlots }).map((_, emptyIndex) => (
                              <div 
                                key={`empty-${emptyIndex}`}
                                className="w-24 h-28 rounded-xl border-2 border-dashed border-gray-700/50 bg-gray-800/20" 
                              />
                            ))}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="card mt-6 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              {!isConnected && (
                <span className="text-yellow-400">Please connect your wallet</span>
              )}
              {isConnected && (() => {
                const requiredCoins = lobby?.numberOfCoins || 6;
                const remaining = requiredCoins - selectedCryptos.length;
                if (selectedCryptos.length < requiredCoins) {
                  return <span>Select {remaining} more cryptocurrency{remaining !== 1 ? 's' : ''}</span>;
                }
                if (selectedCryptos.length === requiredCoins && !captain) {
                  return <span className="text-yellow-400">Select a Captain</span>;
                }
                if (selectedCryptos.length === requiredCoins && captain && !viceCaptain) {
                  return <span className="text-yellow-400">Select a Vice-Captain</span>;
                }
                if (selectedCryptos.length === requiredCoins && captain && viceCaptain && !isPending && !isConfirming) {
                  return <span className="text-white">Team ready to join!</span>;
                }
                return null;
              })()}
              {isPending && <span className="text-yellow-400">Preparing deposit transaction...</span>}
              {isConfirming && <span className="text-yellow-400">Waiting for deposit confirmation...</span>}
              {error && (
                <span className="text-red-400">
                  Deposit failed: {error.message || 'Unknown error'}. Please try again.
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/lobbies')}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={(() => {
                  const requiredCoins = lobby?.numberOfCoins || 6;
                  return selectedCryptos.length !== requiredCoins || 
                         !captain || 
                         !viceCaptain || 
                         !isConnected ||
                         isPending || 
                         isConfirming;
                })()}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  (() => {
                    const requiredCoins = lobby?.numberOfCoins || 6;
                    return selectedCryptos.length === requiredCoins && captain && viceCaptain && isConnected && !isPending && !isConfirming;
                  })()
                    ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isPending && 'Preparing Deposit...'}
                {isConfirming && 'Confirming Deposit...'}
                {!isPending && !isConfirming && 'Confirm & Join'}
              </button>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    </div>
  );
}

