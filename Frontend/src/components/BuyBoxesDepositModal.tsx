'use client';

import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { ModalButton } from './ModalButton';

interface BuyBoxesDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (vrfPath: number) => void;
  selectedVrfPath?: number;
  onVrfPathChange?: (vrfPath: number) => void;
}

export function BuyBoxesDepositModal({ isOpen, onClose, onDeposit, selectedVrfPath = 0, onVrfPathChange }: BuyBoxesDepositModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [vrfPath, setVrfPath] = useState<number>(selectedVrfPath);

  useEffect(() => {
    setVrfPath(selectedVrfPath);
  }, [selectedVrfPath]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.cursor = 'default';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
      setIsDropdownOpen(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.vrf-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999999]"
            style={{ cursor: 'default' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[999999999] flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#121212] border border-gray-800 rounded-none shadow-2xl max-w-md w-full p-8 pointer-events-auto relative overflow-hidden" style={{ cursor: 'default' }}>
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/10 to-[#4079ff]/10" />
              
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-none"
                style={{
                  boxShadow: '0 0 60px rgba(0, 229, 255, 0.3)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                style={{ cursor: 'pointer' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#4079ff] flex items-center justify-center"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-2">Buy Boxes</h2>
                  <p className="text-gray-400">Deposit to purchase mystery boxes</p>
                </div>

                {/* Amount */}
                <div className="bg-gray-800/50 rounded-none p-6 mb-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Deposit Amount</span>
                    <span className="text-2xl font-bold text-white">10 MON</span>
                  </div>
                  <div className="h-px bg-gray-700 mb-4" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">You will receive</span>
                    <span className="text-gray-300">5 Mystery Boxes</span>
                  </div>
                </div>

                {/* VRF Path Selection */}
                <div className="mb-6 vrf-dropdown-container">
                  <label className="block text-gray-400 text-sm mb-2">Select VRF Path</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-none px-4 py-3 text-left text-white flex items-center justify-between hover:bg-gray-800 transition-colors"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex items-center gap-3">
                        {vrfPath === 0 ? (
                          <img 
                            src="https://docs.switchboard.xyz/~gitbook/image?url=https%3A%2F%2F4007759961-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FHKPvtd5LH6FuJ2mj6lRI%252Fsites%252Fsite_63NHP%252Ficon%252FoieZFIF1VwOgAI6LY75x%252Ficon.jpg%3Falt%3Dmedia%26token%3D3156e4ea-c576-4b87-b37d-eec265312ff0&width=32&dpr=2&quality=100&sign=3c2f3e05&sv=2"
                            alt="Switchboard"
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <img 
                            src="https://cdn.prod.website-files.com/633c67ced5457aa4dec572be/66510f175c0f32e77d16c363_pyth.png"
                            alt="Pyth"
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span>{vrfPath === 0 ? 'Switchboard VRF' : 'Pyth VRF'}</span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-[9999999999] w-full mt-1 bg-gray-800 border border-gray-700 rounded-none shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setVrfPath(0);
                            setIsDropdownOpen(false);
                            onVrfPathChange?.(0);
                          }}
                          className={`w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors ${
                            vrfPath === 0 ? 'bg-gray-700' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src="https://docs.switchboard.xyz/~gitbook/image?url=https%3A%2F%2F4007759961-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FHKPvtd5LH6FuJ2mj6lRI%252Fsites%252Fsite_63NHP%252Ficon%252FoieZFIF1VwOgAI6LY75x%252Ficon.jpg%3Falt%3Dmedia%26token%3D3156e4ea-c576-4b87-b37d-eec265312ff0&width=32&dpr=2&quality=100&sign=3c2f3e05&sv=2"
                                alt="Switchboard"
                                className="w-5 h-5 object-contain"
                              />
                              <span>Switchboard VRF</span>
                            </div>
                            <span className="text-xs text-gray-400">0</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVrfPath(1);
                            setIsDropdownOpen(false);
                            onVrfPathChange?.(1);
                          }}
                          className={`w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors border-t border-gray-700 ${
                            vrfPath === 1 ? 'bg-gray-700' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src="https://cdn.prod.website-files.com/633c67ced5457aa4dec572be/66510f175c0f32e77d16c363_pyth.png"
                                alt="Pyth"
                                className="w-5 h-5 object-contain"
                              />
                              <span>Pyth VRF</span>
                            </div>
                            <span className="text-xs text-gray-400">1</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-none p-4 mb-6">
                  <p className="text-blue-400 text-sm text-center">
                    Select 5 boxes from 50 random boxes after deposit
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-800 whitespace-nowrap text-gray-300 font-semibold hover:bg-gray-700 transition-colors"
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <div className="flex-1 whitespace-nowrap">
                    <ModalButton onClick={() => onDeposit(vrfPath)}>
                      Deposit 10 MON
                    </ModalButton>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
