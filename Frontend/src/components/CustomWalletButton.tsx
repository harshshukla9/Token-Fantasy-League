'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'motion/react';

const MANTLE_TESTNET_ID = 5003;
const MANTLE_MAINNET_ID = 5000;

export function CustomWalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is on correct network
  useEffect(() => {
    if (isConnected) {
      const isOnMantleNetwork = chainId === MANTLE_TESTNET_ID || chainId === MANTLE_MAINNET_ID;
      setShowNetworkSwitch(!isOnMantleNetwork);
    } else {
      setShowNetworkSwitch(false);
    }
  }, [chainId, isConnected]);

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (showDropdown && buttonRef.current && mounted) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 400; // Approximate dropdown height
      
      // Calculate position for portal (fixed positioning)
      const top = dropdownPosition === 'top' 
        ? buttonRect.top - dropdownHeight - 8
        : buttonRect.bottom + 8;
      
      // If not enough space below but enough space above, position above
      const newPosition = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom';
      setDropdownPosition(newPosition);
      
      // Calculate position for portal (fixed positioning)
      const calculatedTop = newPosition === 'top' 
        ? buttonRect.top - dropdownHeight - 8
        : buttonRect.bottom + 8;
      
      setDropdownStyle({
        top: calculatedTop,
        right: window.innerWidth - buttonRect.right,
      });
    }
  }, [showDropdown, mounted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const dropdownElement = document.querySelector('[data-wallet-dropdown]');
      
      if (
        buttonRef.current && 
        !buttonRef.current.contains(target) &&
        dropdownElement &&
        !dropdownElement.contains(target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSwitchToTestnet = () => {
    switchChain({ chainId: MANTLE_TESTNET_ID });
  };

  const handleSwitchToMainnet = () => {
    switchChain({ chainId: MANTLE_MAINNET_ID });
  };
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async (): Promise<void> => {
    if (address) {
      await navigator.clipboard.writeText(address);
    }
  };

  if (isConnected && address) {
    const isOnMantleNetwork = chainId === MANTLE_TESTNET_ID || chainId === MANTLE_MAINNET_ID;
    const currentNetworkName = chainId === MANTLE_TESTNET_ID ? 'Mantle Sepolia Testnet' : chainId === MANTLE_MAINNET_ID ? 'Mantle Mainnet' : 'Unknown';

    return (
      <div className="relative flex items-center gap-2 overflow-visible z-[999999]" ref={dropdownRef}>
        {showNetworkSwitch && (
          <motion.button
            onClick={() => setShowDropdown(!showDropdown)}
            className="group relative px-4 py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-red-500/30 cursor-target hover:shadow-lg hover:shadow-red-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative flex items-center gap-2 text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Wrong Network
            </span>
          </motion.button>
        )}

        {/* Wallet Address Button */}
        <motion.button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`group relative px-6 py-2.5 font-semibold rounded-full overflow-visible transition-all hover:scale-105 cursor-target ${
            isOnMantleNetwork
              ? 'bg-white text-black hover:bg-gray-200 hover:shadow-lg hover:shadow-white/20'
              : 'bg-gray-700 text-white hover:bg-gray-600 hover:shadow-lg hover:shadow-gray-700/30'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {formatAddress(address)}
            {isOnMantleNetwork && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {currentNetworkName}
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </motion.button>

        {mounted && createPortal(
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -10 : 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -10 : 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed w-72 bg-[#121212] border border-gray-800 rounded-xl shadow-xl backdrop-blur-md overflow-hidden"
                data-wallet-dropdown
                style={{ 
                  top: dropdownStyle.top,
                  right: dropdownStyle.right,
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto',
                  zIndex: 9999999,
                }}
              >
              <div className="p-4 border-b border-gray-800">
                <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                <p className="text-sm font-mono text-white break-all">{address}</p>
                {isOnMantleNetwork && (
                  <p className="text-xs text-purple-400 mt-2">
                    Network: {currentNetworkName}
                  </p>
                )}
              </div>

              <div className="p-2">
                {/* Network Switch Options */}
                {showNetworkSwitch && (
                  <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400 mb-2 font-semibold">Switch to Mantle Network</p>
                    <div className="flex flex-col gap-1">
                      <motion.button
                        onClick={handleSwitchToTestnet}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-purple-500/10 rounded-lg transition-colors flex items-center gap-2 border border-purple-500/20"
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Switch to Mantle Sepolia Testnet
                      </motion.button>
                      <motion.button
                        onClick={handleSwitchToMainnet}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-purple-600/10 rounded-lg transition-colors flex items-center gap-2 border border-purple-600/20"
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                        Switch to Mantle Mainnet
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Switch Network Options (when on Mantle network) */}
                {isOnMantleNetwork && (
                  <div className="mb-2 p-2 bg-gray-800/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Switch Network</p>
                    <div className="flex flex-col gap-1">
                      {chainId !== MANTLE_TESTNET_ID && (
                        <motion.button
                          onClick={handleSwitchToTestnet}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-purple-500/10 rounded-lg transition-colors flex items-center gap-2"
                          whileHover={{ x: 4 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Switch to Mantle Sepolia Testnet
                        </motion.button>
                      )}
                      {chainId !== MANTLE_MAINNET_ID && (
                        <motion.button
                          onClick={handleSwitchToMainnet}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-purple-600/10 rounded-lg transition-colors flex items-center gap-2"
                          whileHover={{ x: 4 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                          Switch to Mantle Mainnet
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={copyAddress}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2"
                  whileHover={{ x: 4 }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Address
                </motion.button>

                <motion.button
                  onClick={() => {
                    disconnect();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 mt-1"
                  whileHover={{ x: 4 }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Disconnect
                </motion.button>
              </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }

  return (
    <motion.button
      onClick={openConnectModal}
      className="group relative px-6 py-2.5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-gray-200 cursor-target hover:shadow-lg hover:shadow-white/20"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="relative flex items-center gap-2">
        Connect Wallet
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </span>
    </motion.button>
  );
}
