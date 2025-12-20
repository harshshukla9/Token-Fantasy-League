'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { BuyBoxesDepositModal } from './BuyBoxesDepositModal';
import { BoxSelectionModal } from './BoxSelectionModal';
import { BoxResultsModal } from './BoxResultsModal';

export function BuyBoxesButton() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  const [boxResults, setBoxResults] = useState<any[]>([]);
  const [selectedVrfPath, setSelectedVrfPath] = useState<number>(0);

  const handleDeposit = (vrfPath: number) => {
    setSelectedVrfPath(vrfPath);
    setShowDepositModal(false);
    setShowSelectionModal(true);
  };

  const handleBoxesSelected = (selected: number[]) => {
    setSelectedBoxes(selected);
  };

  const handleContinue = (selected: number[]) => {
    if (selected.length !== 5) return;
    
    // Generate random results for selected boxes
    const results = selected.map((boxId) => {
      const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary'];
      const types = ['NFT', 'Token', 'Item', 'Collectible', 'Power-up'];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      return {
        id: boxId,
        name: `${randomRarity.charAt(0).toUpperCase() + randomRarity.slice(1)} ${randomType}`,
        type: randomType,
        rarity: randomRarity,
        value: randomRarity === 'legendary' ? '10 ETH' : randomRarity === 'epic' ? '1 ETH' : randomRarity === 'rare' ? '0.1 ETH' : '0.01 ETH',
      };
    });
    
    setBoxResults(results);
    setShowSelectionModal(false);
    setShowResultsModal(true);
  };

  const handleCloseResults = () => {
    setShowResultsModal(false);
    setSelectedBoxes([]);
    setBoxResults([]);
  };

  return (
    <>
      <motion.button
        onClick={() => setShowDepositModal(true)}
        className="group relative px-6 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#4079ff] text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(0,229,255,0.5)] cursor-target"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4079ff] to-[#00E5FF] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center gap-2">
          Buy Boxes
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </span>
      </motion.button>

      <BuyBoxesDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
        selectedVrfPath={selectedVrfPath}
        onVrfPathChange={setSelectedVrfPath}
      />

      <BoxSelectionModal
        isOpen={showSelectionModal}
        onClose={() => {
          setShowSelectionModal(false);
          setSelectedBoxes([]);
        }}
        onBoxesSelected={handleBoxesSelected}
        onContinue={handleContinue}
        selectedCount={selectedBoxes.length}
      />

      <BoxResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseResults}
        results={boxResults}
      />
    </>
  );
}
