'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Crown, Star, Check, Clock, Trophy } from 'lucide-react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useDepositWithStatus } from '@/hooks/useCFL';
import { LobbyLeaderboard } from './LobbyLeaderboard';
import { formatDateTime, formatDuration, calculateEndTime, simulateCurrentPrice } from '@/shared/utils';

export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

// Available cryptocurrencies to choose from - Updated with real-time prices
const availableCryptos: Cryptocurrency[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 88150, change24h: 2.5 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 2977.8, change24h: 1.8 },
  { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', price: 851.85, change24h: -0.5 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 126.10, change24h: 5.2 },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.38, change24h: 1.2 },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', price: 1.95, change24h: -1.1 },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 1.85, change24h: 3.4 },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', price: 0.85, change24h: 2.1 },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 12.32, change24h: 4.3 },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', price: 13.5, change24h: 1.5 },
  { id: 'ltc', symbol: 'LTC', name: 'Litecoin', price: 79, change24h: -0.8 },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', price: 1.98, change24h: 2.7 },
  { id: 'algo', symbol: 'ALGO', name: 'Algorand', price: 0.115, change24h: 1.9 },
  { id: 'vet', symbol: 'VET', name: 'VeChain', price: 0.0107, change24h: 0.6 },
  { id: 'icp', symbol: 'ICP', name: 'Internet Computer', price: 2.96, change24h: -2.1 },
];

interface TeamSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (team: {
    selectedCryptos: string[];
    captain: string;
    viceCaptain: string;
  }) => void;
  lobbyName: string;
  entryFee: number;
  lobbyId?: string;
  startTime?: Date | string;
  interval?: number;
}

export function TeamSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  lobbyName,
  entryFee,
  lobbyId,
  startTime,
  interval,
}: TeamSelectionModalProps) {
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [viceCaptain, setViceCaptain] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [priceUpdateTime, setPriceUpdateTime] = useState(Date.now());
  const { address, isConnected } = useAccount();
  const { deposit, isPending, isConfirming, isSuccess, error } = useDepositWithStatus();

  // Update prices every second to simulate real-time changes
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceUpdateTime(Date.now());
    }, 1000); // Update every 1 second
    
    return () => clearInterval(interval);
  }, []);

  // Get current prices with randomization based on time
  // Prices update every 10 seconds to show real-time changes
  const currentPrices = useMemo(() => {
    // Use a base timestamp that represents when prices started tracking
    // This ensures consistent simulation across all coins
    const baseTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    return availableCryptos.map(crypto => ({
      ...crypto,
      currentPrice: simulateCurrentPrice(crypto.price, crypto.change24h, baseTimestamp, 0.04),
    }));
  }, [priceUpdateTime]);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedCryptos([]);
    setCaptain(null);
    setViceCaptain(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleCryptoSelect = (cryptoId: string) => {
    if (selectedCryptos.includes(cryptoId)) {
      // Deselect
      setSelectedCryptos(selectedCryptos.filter((id) => id !== cryptoId));
      if (captain === cryptoId) setCaptain(null);
      if (viceCaptain === cryptoId) setViceCaptain(null);
    } else {
      // Select (max 6)
      if (selectedCryptos.length < 6) {
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

  // Handle deposit success - proceed with team confirmation
  useEffect(() => {
    if (isSuccess) {
      // Deposit successful, now proceed with team confirmation
      // Store team data in localStorage with initial prices
      const teamData = {
        lobbyId: lobbyId || '',
        lobbyName: lobbyName,
        entryFee: entryFee,
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

      // Save to localStorage
      try {
        const existingTeams = JSON.parse(localStorage.getItem('fantasyTeams') || '[]');
        existingTeams.push(teamData);
        localStorage.setItem('fantasyTeams', JSON.stringify(existingTeams));
        
        // Also store initial prices for all available coins (for price tracking)
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

      // Call onConfirm callback first
      onConfirm({
        selectedCryptos,
        captain: captain || '',
        viceCaptain: viceCaptain || '',
      });

      // Close the team selection modal
      // The parent component (LobbiesList) will handle showing the leaderboard
      setTimeout(() => {
        handleClose();
      }, 300);
    }
  }, [isSuccess, lobbyId, lobbyName, entryFee, selectedCryptos, captain, viceCaptain, address, onConfirm]);

  const handleConfirm = () => {
    if (selectedCryptos.length !== 6) {
      alert('Please select exactly 6 cryptocurrencies');
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

    // Convert entryFee to wei and deposit
    try {
      const depositAmount = parseEther(entryFee.toString());
      console.log('Depositing amount:', depositAmount.toString(), 'wei');
      deposit(depositAmount);
    } catch (error: any) {
      console.error('Failed to parse deposit amount:', error);
      alert(`Invalid deposit amount: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const getCrypto = (id: string) => currentPrices.find((c) => c.id === id) || availableCryptos.find((c) => c.id === id);

  // Generate dummy price data for line graph
  const generatePriceData = (basePrice: number, change24h: number) => {
    const points = 20;
    const data: number[] = [];
    const trend = change24h > 0 ? 1 : -1;
    
    for (let i = 0; i < points; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // Random variation
      const trendFactor = (i / points) * (change24h / 100) * trend;
      const price = basePrice * (1 + variation + trendFactor);
      data.push(price);
    }
    
    return data;
  };

  // Render mini line graph
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">{lobbyName}</h2>
            <p className="text-sm text-gray-400 mt-1">
              Entry Fee: <span className="text-white font-semibold">{entryFee} tokens</span>
            </p>
            {startTime && interval && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>
                  Duration: <span className="text-white">{formatDuration(interval)}</span>
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  Starts: <span className="text-white">{formatDateTime(startTime)}</span>
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  Ends: <span className="text-white">{formatDateTime(calculateEndTime(startTime, interval))}</span>
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold text-white">Select 6 cryptocurrencies</span> for your fantasy team
            </p>
            <p className="text-sm text-gray-400">
              Choose <span className="font-semibold text-white">1 Captain (2× points)</span> and{' '}
              <span className="font-semibold text-white">1 Vice-Captain (1.5× points)</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Selected: <span className="text-white font-semibold">{selectedCryptos.length}/6</span>
            </p>
          </div>

          {/* Selected Team Section */}
          {selectedCryptos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Your Team ({selectedCryptos.length}/6)</h3>
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
                        <span className="text-sm font-bold text-white">{crypto.symbol}</span>
                        {isCap && <Crown className="h-4 w-4 text-white" />}
                        {isVC && <Star className="h-4 w-4 text-gray-400" />}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{crypto.name}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSetCaptain(cryptoId)}
                          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                            isCap
                              ? 'bg-white text-black font-semibold'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          C
                        </button>
                        <button
                          onClick={() => handleSetViceCaptain(cryptoId)}
                          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
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
                const canSelect = selectedCryptos.length < 6 || isSelected;

                return (
                  <button
                    key={crypto.id}
                    onClick={() => handleCryptoSelect(crypto.id)}
                    disabled={!canSelect}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? isCap
                          ? 'border-white bg-white/10'
                          : isVC
                            ? 'border-gray-400 bg-gray-400/10'
                            : 'border-white bg-white/5'
                        : canSelect
                          ? 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
                          : 'border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{crypto.symbol}</span>
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
                          crypto.change24h >= 0 ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {crypto.change24h >= 0 ? '+' : ''}
                        {crypto.change24h.toFixed(1)}%
                      </span>
                    </div>
                    {/* Mini Line Graph */}
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {!isConnected && (
              <span className="text-yellow-400">Please connect your wallet</span>
            )}
            {isConnected && selectedCryptos.length < 6 && (
              <span>Select {6 - selectedCryptos.length} more cryptocurrency{6 - selectedCryptos.length !== 1 ? 's' : ''}</span>
            )}
            {isConnected && selectedCryptos.length === 6 && !captain && <span className="text-yellow-400">Select a Captain</span>}
            {isConnected && selectedCryptos.length === 6 && captain && !viceCaptain && (
              <span className="text-yellow-400">Select a Vice-Captain</span>
            )}
            {isConnected && selectedCryptos.length === 6 && captain && viceCaptain && !isPending && !isConfirming && (
              <span className="text-white">Team ready to join!</span>
            )}
            {isPending && <span className="text-yellow-400">Preparing deposit transaction...</span>}
            {isConfirming && <span className="text-yellow-400">Waiting for deposit confirmation...</span>}
            {error && (
              <span className="text-red-400">
                Deposit failed: {error.message || 'Unknown error'}. Please try again.
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {lobbyId && (
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                selectedCryptos.length !== 6 || 
                !captain || 
                !viceCaptain || 
                !isConnected ||
                isPending || 
                isConfirming
              }
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                selectedCryptos.length === 6 && captain && viceCaptain && isConnected && !isPending && !isConfirming
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPending && 'Preparing Deposit...'}
              {isConfirming && 'Confirming Deposit...'}
              {!isPending && !isConfirming && 'Confirm & Join'}
            </button>
          </div>
        </div>
      </div>

      {/* Lobby Leaderboard Modal */}
      {lobbyId && (
        <LobbyLeaderboard
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          lobbyId={lobbyId}
          lobbyName={lobbyName}
          startTime={startTime}
          interval={interval}
        />
      )}
    </div>
  );
}

