'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { LootBox } from '@/components/LootBox';
import Squares from '@/components/Squares';

const lootBoxes = [
  { id: 1, name: 'Mystery Box', rarity: 'common' as const, price: 0.01 },
  { id: 2, name: 'Treasure Chest', rarity: 'rare' as const, price: 0.05 },
  { id: 3, name: 'Epic Crate', rarity: 'epic' as const, price: 0.1 },
  { id: 4, name: 'Legendary Vault', rarity: 'legendary' as const, price: 0.5 },
  { id: 5, name: 'Surprise Box', rarity: 'common' as const, price: 0.01 },
  { id: 6, name: 'Rare Bundle', rarity: 'rare' as const, price: 0.05 },
  { id: 7, name: 'Epic Package', rarity: 'epic' as const, price: 0.1 },
  { id: 8, name: 'Legendary Chest', rarity: 'legendary' as const, price: 0.5 },
  { id: 9, name: 'Basic Box', rarity: 'common' as const, price: 0.01 },
  { id: 10, name: 'Rare Box', rarity: 'rare' as const, price: 0.05 },
  { id: 11, name: 'Epic Box', rarity: 'epic' as const, price: 0.1 },
  { id: 12, name: 'Legendary Box', rarity: 'legendary' as const, price: 0.5 },
];

export default function BoxesPage() {
  const [openedBoxes, setOpenedBoxes] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');

  const handleOpenBox = (id: number) => {
    setOpenedBoxes([...openedBoxes, id]);
  };

  const filteredBoxes = filter === 'all' 
    ? lootBoxes 
    : lootBoxes.filter(box => box.rarity === filter);

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={40}
          direction='diagonal'
          borderColor='#00E5FF22'
          hoverFillColor='#222'
        />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="container mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Loot Boxes
            </h1>
            <p className="text-xl text-gray-300 mb-2">Every box has a surprise</p>
            <p className="text-gray-400">Choose a box and discover what&apos;s inside</p>
          </motion.div>

          {/* Filter buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-8 cursor-target"
          >
            {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
              <button
                key={rarity}
                onClick={() => setFilter(rarity)}
                className={`
                  px-6 py-2 rounded-full font-semibold transition-all
                  ${filter === rarity
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </button>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 cursor-target"
          >
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Total Boxes</p>
              <p className="text-3xl font-bold text-white">{lootBoxes.length}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Opened</p>
              <p className="text-3xl font-bold text-[#00E5FF]">{openedBoxes.length}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Remaining</p>
              <p className="text-3xl font-bold text-white">{lootBoxes.length - openedBoxes.length}</p>
            </div>
          </motion.div>

          {/* Loot boxes grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 cursor-target"
          >
            {filteredBoxes.map((box) => (
              <LootBox
                key={box.id}
                id={box.id}
                name={box.name}
                rarity={box.rarity}
                price={box.price}
                onOpen={handleOpenBox}
              />
            ))}
          </motion.div>

          {/* Empty state */}
          {filteredBoxes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-gray-400 text-xl">No boxes found for this filter</p>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-md mt-20">
          <div className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
            <p>Loot.Boxes • Every box has a surprise</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
