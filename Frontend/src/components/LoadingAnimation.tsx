'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CircularText from './CircularText';

export function LoadingAnimation() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    
    // Animate percentage from 0 to 100 over 2.5 seconds
    const startTime = Date.now();
    const duration = 2500; // 2.5 seconds
    
    const updatePercentage = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const newPercentage = Math.floor(progress * 100);
      setPercentage(newPercentage);
      
      if (progress < 1) {
        requestAnimationFrame(updatePercentage);
      }
    };
    
    requestAnimationFrame(updatePercentage);
    
    // Hide animation after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999999999] bg-black flex items-center justify-center overflow-hidden"
          style={{ cursor: 'default' }}
        >
          {/* CircularText centered */}
          <div className="z-50 flex flex-col items-center justify-center">
            <div className="scale-[3.5] origin-center" style={{ marginBottom: '200px' }}>
              <CircularText
                text="CRYPTO * FANTASY * LEAGUE * DREAM11 * STYLE *"
                onHover="speedUp"
                spinDuration={20}
                className="custom-class"
              />
            </div>
            {/* Percentage text below circular div */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-white text-5xl font-bold"
            >
              {percentage}%
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
