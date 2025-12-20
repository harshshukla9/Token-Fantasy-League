'use client';

import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { ModalButton } from './ModalButton';

interface BoxResult {
  id: number;
  name: string;
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: string;
}

interface BoxResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: BoxResult[];
}

const rarityColors = {
  common: {
    bg: 'from-gray-500 to-gray-600',
    border: 'border-gray-400',
    glow: 'rgba(156, 163, 175, 0.5)',
    text: 'text-gray-100',
  },
  rare: {
    bg: 'from-blue-500 to-blue-600',
    border: 'border-blue-400',
    glow: 'rgba(59, 130, 246, 0.6)',
    text: 'text-blue-100',
  },
  epic: {
    bg: 'from-purple-500 to-purple-600',
    border: 'border-purple-400',
    glow: 'rgba(168, 85, 247, 0.7)',
    text: 'text-purple-100',
  },
  legendary: {
    bg: 'from-yellow-400 to-orange-500',
    border: 'border-yellow-300',
    glow: 'rgba(251, 191, 36, 0.8)',
    text: 'text-yellow-50',
  },
};

const rewardIcons: Record<string, string> = {
  'NFT': '🖼️',
  'Token': '🪙',
  'Item': '🎁',
  'Collectible': '🏆',
  'Power-up': '⚡',
};

export function BoxResultsModal({ isOpen, onClose, results }: BoxResultsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.cursor = 'default';
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
    };
  }, [isOpen]);

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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999999]"
            style={{ cursor: 'default' }}
            onClick={onClose}
          />

          {/* Confetti */}
          {showConfetti && windowSize.width > 0 && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={300}
              colors={['#00E5FF', '#4079ff', '#40ffaa', '#ffaa40', '#ff4081']}
              style={{ position: 'fixed', top: 0, left: 0, zIndex: 999999998, pointerEvents: 'none' }}
            />
          )}

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            className="fixed inset-0 z-[999999999] flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#121212] border border-gray-800 rounded-none shadow-2xl max-w-5xl w-full max-h-[90vh] p-8 pointer-events-auto relative overflow-hidden flex flex-col" style={{ cursor: 'default' }}>
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/10 to-[#4079ff]/10" />
              
              {/* Glow effect */}
              <motion.div 
                className="absolute inset-0 rounded-none"
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(0, 229, 255, 0.3)',
                    '0 0 80px rgba(0, 229, 255, 0.5)',
                    '0 0 40px rgba(0, 229, 255, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
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

              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                      className="text-4xl"
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-2">Your Rewards!</h2>
                  <p className="text-gray-400">You received {results.length} rewards</p>
                </motion.div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((result, index) => {
                      const colors = rarityColors[result.rarity];
                      const icon = rewardIcons[result.type] || '🎁';

                      return (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, scale: 0.5, y: 50 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 200 }}
                          className={`bg-gradient-to-r ${colors.bg} rounded-none p-6 border-2 ${colors.border} relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="relative z-10">
                            <motion.div
                              animate={{ 
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1],
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="text-5xl mb-3 text-center"
                            >
                              {icon}
                            </motion.div>
                            <p className={`${colors.text} text-xs mb-2 uppercase tracking-wider text-center`}>
                              {result.rarity}
                            </p>
                            <h3 className="text-xl font-bold text-white mb-2 text-center">{result.name}</h3>
                            <p className="text-white/80 text-sm text-center mb-3">{result.type}</p>
                            {result.value && (
                              <div className="pt-3 border-t border-white/20">
                                <p className="text-white/60 text-xs text-center mb-1">Value</p>
                                <p className="text-lg font-bold text-white text-center">{result.value}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Close button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <ModalButton onClick={onClose}>
                    Claim All Rewards
                  </ModalButton>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
