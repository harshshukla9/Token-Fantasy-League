'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
  label?: string; // Custom label (default: "Starts In" or "Ends In")
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // Total milliseconds
}

export function CountdownTimer({ targetDate, onComplete, label }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        setIsComplete(true);
        if (onComplete) onComplete();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (!timeRemaining) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isComplete) {
    const isEndTime = label?.toLowerCase().includes('end');
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-green-400 font-semibold text-sm mb-2">
          {isEndTime ? 'Ended!' : 'Started!'}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // Calculate progress percentage (for visual representation)
  const maxDuration = 7 * 24 * 60 * 60 * 1000; // Assume max 7 days
  const progress = Math.min((timeRemaining.total / maxDuration) * 100, 100);

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-3">
      {/* Clock Icon */}
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label || 'Starts In'}</span>
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2">
        {timeRemaining.days > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-white">{String(timeRemaining.days).padStart(2, '0')}</div>
            <div className="text-[10px] text-gray-400 uppercase">Days</div>
          </div>
        )}
        {timeRemaining.days > 0 && <div className="text-white text-xl">:</div>}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white">{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-400 uppercase">Hours</div>
        </div>
        <div className="text-white text-xl">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white">{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-400 uppercase">Mins</div>
        </div>
        <div className="text-white text-xl">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white">{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-400 uppercase">Secs</div>
        </div>
      </div>

      {/* Animated Dots Progress Indicator */}
      <div className="flex items-center gap-1.5 mt-3">
        {Array.from({ length: 12 }).map((_, index) => {
          // Calculate which dots should be active based on progress
          const activeDots = Math.floor((progress / 100) * 12);
          const isActive = index < activeDots;
          const isPulsing = index === activeDots - 1 && activeDots > 0;

          return (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-sm shadow-white/50'
                  : 'bg-gray-700'
              } ${isPulsing ? 'animate-pulse' : ''}`}
              style={{
                opacity: isActive ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Progress Bar (subtle) */}
      <div className="w-full max-w-[120px] h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-white/50 to-white transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

