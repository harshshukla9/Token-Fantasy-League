'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DepositModal } from './DepositModal';
import { RewardModal } from './RewardModal';

interface LootBoxProps {
  id: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price?: number;
  onOpen?: (id: number) => void;
}

const rarityColors = {
  common: {
    bg: 'bg-gray-500',
    border: 'border-gray-400',
    text: 'text-gray-100',
    shadow: 'shadow-gray-500/30',
    glow: 'rgba(156, 163, 175, 0.5)',
  },
  rare: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    text: 'text-blue-100',
    shadow: 'shadow-blue-500/30',
    glow: 'rgba(59, 130, 246, 0.6)',
  },
  epic: {
    bg: 'bg-purple-500',
    border: 'border-purple-400',
    text: 'text-purple-100',
    shadow: 'shadow-purple-500/30',
    glow: 'rgba(168, 85, 247, 0.7)',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    border: 'border-yellow-300',
    text: 'text-yellow-50',
    shadow: 'shadow-yellow-500/40',
    glow: 'rgba(251, 191, 36, 0.8)',
  },
};

// Cube Face Component
function CubeFace({ 
  colors, 
  isHovered, 
  isOpening, 
  isOpened, 
  transform, 
  face,
  name,
  rarity,
  showContent = false 
}: {
  colors: typeof rarityColors.common;
  isHovered: boolean;
  isOpening: boolean;
  isOpened: boolean;
  transform: string;
  face: string;
  name?: string;
  rarity?: string;
  showContent?: boolean;
}) {
  // Darker shades for side faces
  const getFaceStyle = () => {
    if (face === 'back') return { filter: 'brightness(0.7)' };
    if (face === 'top') return { filter: 'brightness(1.1)' };
    if (face === 'bottom') return { filter: 'brightness(0.5)' };
    if (face === 'left' || face === 'right') return { filter: 'brightness(0.8)' };
    return {};
  };

  return (
    <div
      className={`
        absolute w-full h-full ${colors.bg} ${colors.border}
        border-4
        ${isOpened ? 'opacity-50' : ''}
      `}
      style={{
        transform,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        ...getFaceStyle(),
      }}
    >
      {/* Pattern overlay for all faces */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 w-4 h-4 border-2 border-white rounded-sm"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-2 border-white rounded-sm"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-white rounded-sm"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-white rounded-sm"></div>
      </div>
    </div>
  );
}

// Hardcoded rewards for demo
const rewards = {
  common: [
    { name: 'Common NFT', type: 'NFT', value: '0.01 ETH', rarity: 'common' as const },
    { name: '100 Tokens', type: 'Token', value: '$10', rarity: 'common' as const },
    { name: 'Basic Item', type: 'Item', rarity: 'common' as const },
  ],
  rare: [
    { name: 'Rare NFT', type: 'NFT', value: '0.1 ETH', rarity: 'rare' as const },
    { name: '500 Tokens', type: 'Token', value: '$50', rarity: 'rare' as const },
    { name: 'Rare Collectible', type: 'Collectible', value: '0.05 ETH', rarity: 'rare' as const },
  ],
  epic: [
    { name: 'Epic NFT', type: 'NFT', value: '1 ETH', rarity: 'epic' as const },
    { name: '2000 Tokens', type: 'Token', value: '$200', rarity: 'epic' as const },
    { name: 'Epic Power-up', type: 'Power-up', rarity: 'epic' as const },
  ],
  legendary: [
    { name: 'Legendary NFT', type: 'NFT', value: '10 ETH', rarity: 'legendary' as const },
    { name: '10000 Tokens', type: 'Token', value: '$1000', rarity: 'legendary' as const },
    { name: 'Legendary Artifact', type: 'Collectible', value: '5 ETH', rarity: 'legendary' as const },
  ],
};

export function LootBox({ id, name, rarity, price, onOpen }: LootBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [reward, setReward] = useState<{
    name: string;
    type: string;
    value?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  } | null>(null);

  const handleClick = () => {
    if (isOpened || isOpening) return;
    setShowDepositModal(true);
  };

  const handleDeposit = () => {
    setShowDepositModal(false);
    
    // Simulate deposit and get random reward
    const rewardPool = rewards[rarity];
    const randomReward = rewardPool[Math.floor(Math.random() * rewardPool.length)];
    setReward({
      name: randomReward.name,
      type: randomReward.type,
      value: randomReward.value,
      rarity: randomReward.rarity,
    });
    
    // Show opening animation
    setIsOpening(true);
    setShowParticles(true);
    
    setTimeout(() => {
      setIsOpening(false);
      setShowParticles(false);
      setIsOpened(true);
      setShowRewardModal(true);
      onOpen?.(id);
    }, 2000);
  };

  const handleCloseReward = () => {
    setShowRewardModal(false);
  };

  const colors = rarityColors[rarity];
  
  // Create particles array for opening animation
  const particles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <motion.div
      className="relative cursor-target w-full aspect-square"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: id * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        perspective: '1000px',
        perspectiveOrigin: 'center center',
      }}
    >
      {/* 3D Cube Container */}
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
        initial={{
          rotateX: -15,
          rotateY: 15,
        }}
        animate={{
          rotateX: isHovered && !isOpened ? [0, -25, 25, 0] : isOpening ? [0, 360] : -15,
          rotateY: isHovered && !isOpened ? [0, 25, -25, 0] : isOpening ? [0, 360] : 15,
          scale: isHovered && !isOpened ? 1.15 : isOpening ? [1, 1.1, 1] : 1,
          y: isHovered && !isOpened ? -15 : 0,
        }}
        transition={{ 
          duration: isOpening ? 0.4 : 0.8, 
          ease: "easeOut",
          repeat: isOpening ? Infinity : 0,
          repeatType: "reverse"
        }}
        onClick={handleClick}
        whileTap={{ scale: 0.9 }}
      >
        {/* Cube wrapper - creates the 3D space */}
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(-40px)',
          }}
        >
          {/* Front Face */}
          <CubeFace
            colors={colors}
            isHovered={isHovered}
            isOpening={isOpening}
            isOpened={isOpened}
            transform="rotateY(0deg) translateZ(40px)"
            face="front"
            name={name}
            rarity={rarity}
            showContent={true}
          />

          {/* Back Face */}
          <CubeFace
            colors={colors}
            isHovered={isHovered}
            isOpening={isOpening}
            isOpened={isOpened}
            transform="rotateY(180deg) translateZ(40px)"
            face="back"
          />

          {/* Top Face */}
          <CubeFace
            colors={colors}
            isHovered={isHovered}
            isOpening={isOpening}
            isOpened={isOpened}
            transform="rotateX(90deg) translateZ(40px)"
            face="top"
          />

          {/* Bottom Face */}
          <CubeFace
            colors={colors}
            isHovered={isHovered}
            isOpening={isOpening}
            isOpened={isOpened}
            transform="rotateX(-90deg) translateZ(40px)"
            face="bottom"
          />

          {/* Right Face */}
          <CubeFace
            colors={colors}
            isHovered={isHovered}
            isOpening={isOpening}
            isOpened={isOpened}
            transform="rotateY(90deg) translateZ(40px)"
            face="right"
          />

          {/* Left Face */}
          <CubeFace
            colors={colors}
            isHovered={isHovered}
            isOpening={isOpening}
            isOpened={isOpened}
            transform="rotateY(-90deg) translateZ(40px)"
            face="left"
          />
        </div>
      </motion.div>

      {/* Content overlay for front face only - positioned above the cube */}
      <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-auto cursor-pointer"
          style={{
            transform: 'translateZ(41px)',
          }}
          onClick={handleClick}
        >
          {/* Pulsing glow effect for unopened boxes */}
          {!isOpened && !isOpening && (
            <motion.div
              className="absolute inset-0"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: `radial-gradient(circle at center, ${colors.glow}, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Shimmer effect on hover */}
          {isHovered && !isOpened && !isOpening && (
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Box content */}
          <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.div
              key="closed"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
            >
              {/* 2D Box pattern - corners */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-2 left-2 w-6 h-6 border-2 border-white rounded-sm"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white rounded-sm"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-2 border-white rounded-sm"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-2 border-white rounded-sm"></div>
              </div>

              {/* Center lines for 2D box effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white"></div>
              </div>

              {/* Question mark or icon */}
              <motion.div
                animate={{
                  scale: isHovered ? 1.2 : isOpening ? [1, 1.3, 1] : 1,
                  rotate: isOpening ? [0, 180, 360] : 0,
                }}
                transition={{ 
                  duration: isOpening ? 0.6 : 0.3,
                  repeat: isOpening ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="relative z-10 text-5xl font-bold text-white drop-shadow-2xl"
              >
                {isOpening ? (
                  <motion.div
                    className="relative"
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                  >
                    <motion.span
                      className="absolute inset-0"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      ✨
                    </motion.span>
                    <motion.span
                      className="relative"
                      animate={{ 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 0.6, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      ✨
                    </motion.span>
                  </motion.div>
                ) : (
                  <motion.span
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ?
                  </motion.span>
                )}
              </motion.div>

              {/* Box name */}
              <motion.p
                className={`relative z-10 mt-3 ${colors.text} font-bold text-sm text-center px-2`}
                animate={{ y: isHovered ? -3 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {name}
              </motion.p>

              {/* Rarity badge - 2D style */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded bg-black/60 ${colors.text} text-xs font-bold uppercase border-2 ${colors.border}`}>
                {rarity}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="opened"
              initial={{ opacity: 0, scale: 0.3, rotate: 180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 150,
                damping: 12
              }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
            >
              {/* Opened content with enhanced animation */}
              <motion.div
                initial={{ scale: 0, rotate: -360, y: 50 }}
                animate={{ 
                  scale: [0, 1.3, 1],
                  rotate: [0, 360, 0],
                  y: 0
                }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.8,
                  type: "spring", 
                  stiffness: 200,
                  damping: 10
                }}
                className="text-5xl mb-3 relative"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🎁
                </motion.div>
                {/* Sparkle effects around gift */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{
                      x: Math.cos((i * 90) * Math.PI / 180) * 40,
                      y: Math.sin((i * 90) * Math.PI / 180) * 40,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: 360,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5 + i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeOut"
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className={`${colors.text} font-bold text-sm text-center`}
              >
                Opened!
              </motion.p>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '60%', opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mt-2"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced hover effect - animated border */}
        {isHovered && !isOpened && !isOpening && (
          <>
            <motion.div
              className={`absolute -inset-1 border-4 ${colors.border} rounded-lg`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.9, 1.05, 0.9]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ 
                borderStyle: 'dashed',
                filter: `blur(2px)`,
              }}
            />
            <motion.div
              className={`absolute inset-0 border-2 ${colors.border} rounded-lg`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </>
        )}

        {/* Opening animation overlay with multiple layers */}
        {isOpening && (
          <>
            <motion.div
              className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 1, 0.8, 0],
                scale: [0.8, 1.2, 1]
              }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `radial-gradient(circle at center, ${colors.glow}, transparent)`,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 2]
              }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </>
        )}

        {/* Particle effects during opening */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {particles.map((particle) => (
              <motion.div
                key={particle}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: colors.glow,
                  left: '50%',
                  top: '50%',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 1
                }}
                animate={{
                  x: Math.cos((particle * 360) / particles.length * Math.PI / 180) * 100,
                  y: Math.sin((particle * 360) / particles.length * Math.PI / 180) * 100,
                  opacity: [1, 0.8, 0],
                  scale: [1, 1.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: particle * 0.05,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
        </motion.div>
      </div>

      {/* Enhanced price tag */}
      {price && !isOpened ? (
        <motion.div
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-black text-white px-4 py-2 rounded-lg text-xs font-bold border-2 border-gray-600 shadow-xl z-10"
          animate={{ 
            y: isHovered ? -5 : 0,
            scale: isHovered ? 1.1 : 1,
            boxShadow: isHovered 
              ? '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(255,255,255,0.2)'
              : '0 4px 12px rgba(0,0,0,0.3)'
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ 
            scale: 1.15,
            boxShadow: '0 15px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.3)'
          }}
        >
          <motion.span
            animate={{
              textShadow: [
                '0 0 5px rgba(255,255,255,0.5)',
                '0 0 10px rgba(255,255,255,0.8)',
                '0 0 5px rgba(255,255,255,0.5)',
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {price} ETH
          </motion.span>
        </motion.div>
      ) : null}

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
        boxName={name}
        rarity={rarity}
        amount={price || 0}
      />

      {/* Reward Modal */}
      {reward && (
        <RewardModal
          isOpen={showRewardModal}
          onClose={handleCloseReward}
          reward={reward}
        />
      )}
    </motion.div>
  );
}
