'use client';

import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { ModalButton } from './ModalButton';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: () => void;
  boxName: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  amount: number;
}

const rarityColors = {
  common: {
    bg: 'from-gray-500 to-gray-600',
    border: 'border-gray-400',
    glow: 'rgba(156, 163, 175, 0.5)',
  },
  rare: {
    bg: 'from-blue-500 to-blue-600',
    border: 'border-blue-400',
    glow: 'rgba(59, 130, 246, 0.6)',
  },
  epic: {
    bg: 'from-purple-500 to-purple-600',
    border: 'border-purple-400',
    glow: 'rgba(168, 85, 247, 0.7)',
  },
  legendary: {
    bg: 'from-yellow-400 to-orange-500',
    border: 'border-yellow-300',
    glow: 'rgba(251, 191, 36, 0.8)',
  },
};

export function DepositModal({ isOpen, onClose, onDeposit, boxName, rarity, amount }: DepositModalProps) {
  const [mounted, setMounted] = useState(false);

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
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
    };
  }, [isOpen]);

  const colors = rarityColors[rarity];

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
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-10`} />
              
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-none"
                style={{
                  boxShadow: `0 0 60px ${colors.glow}`,
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
                  <h2 className="text-3xl font-bold text-white mb-2">Deposit Required</h2>
                  <p className="text-gray-400">Open {boxName}</p>
                </div>

                {/* Box info */}
                <div className={`bg-gradient-to-r ${colors.bg} rounded-none p-6 mb-6 border-2 ${colors.border} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 text-center">
                    <p className="text-white/80 text-sm mb-2">Box Type</p>
                    <p className="text-2xl font-bold text-white uppercase">{rarity}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-gray-800/50 rounded-none p-6 mb-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Deposit Amount</span>
                    <span className="text-2xl font-bold text-white">{amount} ETH</span>
                  </div>
                  <div className="h-px bg-gray-700 mb-4" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-gray-300">~0.001 ETH</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 font-semibold hover:bg-gray-700 transition-colors"
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <div className="flex-1">
                    <ModalButton onClick={onDeposit}>
                      Deposit
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
