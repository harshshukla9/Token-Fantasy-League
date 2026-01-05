'use client';

/**
 * Consolidated Wallet Connection Module
 * 
 * This file contains all wallet-related functionality:
 * - Wallet connection hooks and utilities
 * - Wallet button component
 * - Network configuration (Mantle)
 * - Helper functions
 */

import { useState, useRef, useEffect } from 'react';
import { 
  useAccount, 
  useDisconnect, 
  useChainId, 
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useReadContract,
  useBalance
} from 'wagmi';
import { useConnectModal, ConnectButton } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { Copy, LogOut, ExternalLink, ChevronDown, Wallet, AlertTriangle } from 'lucide-react';
import { formatEther } from 'viem';

// ============================================================================
// Network Configuration - Mantle
// ============================================================================

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
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz'] 
    },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://sepolia.mantlescan.xyz/' },
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
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz'] 
    },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://mantlescan.xyz/' },
  },
  testnet: false,
});

// Network constants
export const MANTLE_TESTNET_ID = 5003;
export const MANTLE_MAINNET_ID = 5000;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format wallet address for display
 */
export const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

/**
 * Check if connected to Mantle network
 */
export const isOnMantleNetwork = (chainId: number): boolean => {
  return chainId === MANTLE_TESTNET_ID || chainId === MANTLE_MAINNET_ID;
};

/**
 * Get network name from chain ID
 */
export const getNetworkName = (chainId: number): string => {
  if (chainId === MANTLE_TESTNET_ID) return 'Mantle Sepolia Testnet';
  if (chainId === MANTLE_MAINNET_ID) return 'Mantle Mainnet';
  return 'Unknown';
};

/**
 * Get explorer URL for address
 */
export const getExplorerUrl = (address: string, chainId?: number): string => {
  const isTestnet = chainId === MANTLE_TESTNET_ID || !chainId;
  const baseUrl = isTestnet ? 'https://sepolia.mantlescan.xyz' : 'https://mantlescan.xyz';
  return `${baseUrl}/address/${address}`;
};

/**
 * Copy address to clipboard
 */
export const copyAddressToClipboard = async (address: string, onSuccess?: () => void): Promise<void> => {
  if (address) {
    await navigator.clipboard.writeText(address);
    if (onSuccess) onSuccess();
  }
};

// ============================================================================
// Re-export wagmi hooks for convenience
// ============================================================================

export {
  useAccount,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useReadContract,
  useBalance,
  useConnectModal,
  ConnectButton
};

// ============================================================================
// WalletConnect Component
// ============================================================================

interface WalletConnectProps {
  onCopySuccess?: (message: string) => void;
  contractAddress?: string;
}

export function WalletConnect({ onCopySuccess, contractAddress }: WalletConnectProps = {}) {
  const { disconnect } = useDisconnect();
  
  // Local UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    if (onCopySuccess) {
      onCopySuccess('Address copied');
    }
    setIsDropdownOpen(false);
  };

  const viewOnExplorer = (address: string) => {
    window.open(getExplorerUrl(address), '_blank');
    setIsDropdownOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  // Inner component to use wagmi hooks conditionally
  const ConnectedWalletButton = ({ 
    account, 
    chain, 
    openChainModal,
  }: { 
    account: any; 
    chain: any; 
    openChainModal: () => void;
  }) => {
    // Get balance using wagmi hook - can be called here since component is only rendered when connected
    const { data: balance } = useBalance({
      address: account?.address as `0x${string}` | undefined,
    });

    // Check if wallet is connected to the correct chain
    const isCorrectChain = chain?.id === MANTLE_TESTNET_ID || chain?.id === MANTLE_MAINNET_ID;

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group cursor-pointer"
        >
          {/* Balance */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 font-mono">
              {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : account.displayBalance || '0.0000'}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              {balance?.symbol || 'MNT'}
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Address */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {account.address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-mono text-white hidden sm:inline">
              {account.displayName || formatAddress(account.address)}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
            {/* Account Info */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Connected</div>
                {!isCorrectChain && (
                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Wrong Chain</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {account.address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-mono text-white truncate">{account.address}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {balance 
                      ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` 
                      : account.displayBalance || '0.0000 MNT'}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2">
              {!isCorrectChain && (
                <button
                  onClick={openChainModal}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-yellow-400 hover:bg-yellow-400/10 transition-colors mb-2 border border-yellow-500/30 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Switch to Mantle Network</span>
                </button>
              )}
              <button
                onClick={() => account.address && copyToClipboard(account.address)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Copy className="h-4 w-4 text-gray-400" />
                <span>Copy Address</span>
              </button>
              <button
                onClick={() => account.address && viewOnExplorer(account.address)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span>View on Explorer</span>
              </button>
              {contractAddress && (
                <button
                  onClick={() => viewOnExplorer(contractAddress)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <span>View Contract</span>
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        // Check if wallet is connected to the correct chain
        const isCorrectChain = chain?.id === MANTLE_TESTNET_ID || chain?.id === MANTLE_MAINNET_ID;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Not connected - show custom connect button
              if (!connected) {
                return (
                  <div className="relative">
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-medium text-sm transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)] hover:scale-105"
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline">Connect Wallet</span>
                      <span className="sm:hidden">Connect</span>
                    </button>
                  </div>
                );
              }

              // Wrong network - show custom chain switch button
              if (chain.unsupported || !isCorrectChain) {
                return (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                        if (!isDropdownOpen) {
                          openChainModal();
                        }
                      }}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 font-medium text-sm transition-all hover:bg-yellow-500/20"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline">Wrong Network</span>
                      <span className="sm:hidden">Wrong Net</span>
                    </button>
                    
                    {/* Chain Warning Banner */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-yellow-500/50 bg-yellow-500/10 backdrop-blur-xl p-3 mb-2 z-50">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-yellow-500 mb-1">Wrong Network</div>
                            <div className="text-xs text-yellow-400/80 mb-2">
                              Please switch to Mantle Network to continue.
                            </div>
                            <button
                              onClick={openChainModal}
                              className="w-full px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-xs font-medium transition-colors"
                            >
                              Switch Network
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Connected - show custom connected button with dropdown
              return (
                <ConnectedWalletButton 
                  account={account} 
                  chain={chain} 
                  openChainModal={openChainModal}
                />
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// ============================================================================
// Custom Wallet Button (Legacy - for backward compatibility)
// ============================================================================

export function CustomWalletButton() {
  return <WalletConnect />;
}

// ============================================================================
// Protected Route Component
// ============================================================================

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="card max-w-md w-full text-center space-y-6 p-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-warm-white mb-2">Access Restricted</h2>
            <p className="text-gray-400">
              Please connect your wallet to access this page.
            </p>
          </div>

          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

