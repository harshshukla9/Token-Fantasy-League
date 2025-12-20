'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ModalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function ModalButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  type = 'button'
}: ModalButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-6 py-4 bg-white text-black font-bold
        flex items-center justify-center gap-2
        transition-all relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        ${className}
      `}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      <span className="relative">{children}</span>
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2.5} 
          d="M13 7l5 5m0 0l-5 5m5-5H6" 
        />
      </svg>
    </motion.button>
  );
}

