'use client';

import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { ModalButton } from './ModalButton';

interface BoxSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoxesSelected: (selected: number[]) => void;
  onContinue: (selected: number[]) => void;
  selectedCount: number;
}

const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary'];

const rarityColors = {
  common: {
    bg: 'bg-gray-500',
    border: 'border-gray-400',
  },
  rare: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
  },
  epic: {
    bg: 'bg-purple-500',
    border: 'border-purple-400',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    border: 'border-yellow-300',
  },
};

export function BoxSelectionModal({ 
  isOpen, 
  onClose, 
  onBoxesSelected, 
  onContinue,
  selectedCount 
}: BoxSelectionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<Set<number>>(new Set());
  const [boxes] = useState(() => {
    // Generate 50 random boxes
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      rarity: rarities[Math.floor(Math.random() * rarities.length)] as typeof rarities[number],
    }));
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.cursor = 'default';
      setSelectedBoxes(new Set());
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.cursor = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectedBoxes.size > 0) {
      onBoxesSelected(Array.from(selectedBoxes));
    }
  }, [selectedBoxes, onBoxesSelected]);

  const handleBoxClick = (boxId: number) => {
    if (selectedBoxes.has(boxId)) {
      // Deselect
      setSelectedBoxes(prev => {
        const newSet = new Set(prev);
        newSet.delete(boxId);
        return newSet;
      });
    } else {
      // Select (max 5)
      if (selectedBoxes.size < 5) {
        setSelectedBoxes(prev => new Set(prev).add(boxId));
      }
    }
  };

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
            <div className="bg-[#121212] border border-gray-800 rounded-none shadow-2xl max-w-md w-full max-h-[90vh] p-8 pointer-events-auto relative overflow-hidden flex flex-col" style={{ cursor: 'default' }}>
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

              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Select 5 Boxes</h2>
                  <p className="text-gray-400">
                    Choose your mystery boxes ({selectedBoxes.size}/5 selected)
                  </p>
                </div>

                {/* Boxes Grid */}
                <div className="flex-1 overflow-y-auto mb-6" style={{ maxHeight: '400px' }}>
                  <div className="grid grid-cols-5 gap-3">
                    {boxes.map((box) => {
                      const isSelected = selectedBoxes.has(box.id);
                      const colors = rarityColors[box.rarity];
                      const canSelect = selectedBoxes.size < 5 || isSelected;

                      return (
                        <motion.button
                          key={box.id}
                          onClick={() => canSelect && handleBoxClick(box.id)}
                          disabled={!canSelect && !isSelected}
                          className={`
                            aspect-square ${colors.bg} ${colors.border} border-4 rounded-none
                            relative overflow-hidden transition-all
                            ${isSelected 
                              ? 'ring-4 ring-[#00E5FF] ring-offset-2 ring-offset-[#121212] scale-110' 
                              : canSelect 
                              ? 'hover:scale-105' 
                              : 'opacity-30'
                            }
                          `}
                          style={{ cursor: canSelect ? 'pointer' : 'not-allowed' }}
                          whileHover={canSelect && !isSelected ? { scale: 1.05 } : {}}
                          whileTap={canSelect ? { scale: 0.95 } : {}}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 bg-[#00E5FF]/20 flex items-center justify-center"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#00E5FF] flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </motion.div>
                          )}

                          {/* Question mark */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white drop-shadow-lg">?</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Continue Button */}
                <ModalButton
                  onClick={() => {
                    if (selectedBoxes.size === 5) {
                      const selectedArray = Array.from(selectedBoxes);
                      onBoxesSelected(selectedArray);
                      onContinue(selectedArray);
                    }
                  }}
                  disabled={selectedBoxes.size !== 5}
                >
                  {selectedBoxes.size === 5 ? 'Continue' : `Select ${5 - selectedBoxes.size} more box${5 - selectedBoxes.size !== 1 ? 'es' : ''}`}
                </ModalButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
