import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useCounters } from '../context/CounterContext';

interface CounterProps {
  targetValue: number;
  onTargetChange: (newTarget: number) => void;
}

export const Counter = ({ targetValue, onTargetChange }: CounterProps) => {
  const { counters, activeCounterIndex, updateCounter } = useCounters();
  const activeCounter = counters[activeCounterIndex];
  const [feedback, setFeedback] = useState<'increment' | 'decrement' | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetValue.toString());
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [currentMovement, setCurrentMovement] = useState(0);
  const counterDisplayRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = 50; // Reduced threshold for more responsive feel
  
  const progress = Math.min((activeCounter.count / targetValue) * 100, 100);

  const calculateSteps = (distance: number): number => {
    // Exponential scaling: base * (growth_rate ^ (distance / threshold))
    // Adjusted to give reasonable numbers for typical swipe distances
    const base = 1;
    const growthRate = 1.15;
    const steps = Math.floor(base * Math.pow(growthRate, Math.abs(distance) / swipeThreshold));
    return steps;
  };

  const handleIncrement = (amount: number = 1) => {
    const newCount = Math.min(activeCounter.count + amount, targetValue);
    if (newCount !== activeCounter.count) {
      updateCounter(activeCounter.id, { count: newCount });
      setFeedback('increment');
      setTimeout(() => setFeedback(null), 300);
    }
  };

  const handleDecrement = (amount: number = 1) => {
    const newCount = Math.max(activeCounter.count - amount, 0);
    if (newCount !== activeCounter.count) {
      updateCounter(activeCounter.id, { count: newCount });
      setFeedback('decrement');
      setTimeout(() => setFeedback(null), 300);
    }
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTarget = parseInt(tempTarget);
    if (!isNaN(newTarget) && newTarget > 0) {
      onTargetChange(newTarget);
      setIsEditingTarget(false);
    }
  };

  const handleCounterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTarget(true);
  };

  const bind = useGesture({
    onDrag: ({ movement: [, my], tap, event, active, last }) => {
      if (isEditingTarget) return;
      
      if (event && counterDisplayRef.current?.contains(event.target as Node)) {
        return;
      }
      
      if (tap) {
        handleIncrement();
        return;
      }

      setCurrentMovement(my);

      // Calculate steps and progress
      const steps = calculateSteps(my);
      const baseProgress = Math.abs(my) / swipeThreshold;
      const progress = baseProgress - Math.floor(baseProgress);
      setSwipeProgress(progress);

      // Show feedback during swipe
      if (active && Math.abs(my) > 10) {
        setFeedback(my > 0 ? 'decrement' : 'increment');
      }

      // Execute action when gesture ends
      if (last && steps > 0) {
        if (my > 0) {
          handleDecrement(steps);
        } else {
          handleIncrement(steps);
        }
      }

      // Clear feedback when gesture ends
      if (!active) {
        setSwipeProgress(0);
        setCurrentMovement(0);
        if (steps === 0) {
          setFeedback(null);
        }
      }
    }
  }, {
    drag: {
      delay: 0,
      filterTaps: true,
      threshold: 5,
    }
  });

  // Format the current steps for display
  const formatSteps = (distance: number): string => {
    if (Math.abs(distance) < 10) return '';
    const steps = calculateSteps(distance);
    return steps > 0 ? `×${steps}` : '';
  };

  return (
    <div 
      {...bind()}
      className="h-screen w-full relative bg-gray-100 touch-none select-none"
    >
      {/* Progress Bar */}
      <motion.div 
        className="absolute bottom-0 w-full bg-blue-500"
        initial={{ height: 0 }}
        animate={{ height: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Counter Display */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center text-4xl font-bold"
        animate={{
          scale: feedback ? 1 + (swipeProgress * 0.1) : 1,
          color: feedback === 'increment' ? 'rgb(34, 197, 94)' : 
                 feedback === 'decrement' ? 'rgb(239, 68, 68)' : 'rgb(0, 0, 0)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div 
          ref={counterDisplayRef}
          className="bg-white/80 px-6 py-3 rounded-lg shadow-lg cursor-pointer"
          onClick={handleCounterClick}
        >
          <span>{activeCounter.count}</span>
          <span className="text-gray-400"> / {targetValue}</span>
        </div>
      </motion.div>

      {/* Visual Feedback Indicators */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: feedback === 'increment' ? 20 : -20, scale: 0.5 }}
            animate={{ 
              opacity: swipeProgress || 1,
              y: 0,
              scale: swipeProgress || 1
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`absolute left-1/2 transform -translate-x-1/2 ${
              feedback === 'increment' ? 'bottom-1/4' : 'top-1/4'
            } text-2xl`}
          >
            <div className="flex flex-col items-center">
              {feedback === 'increment' ? '↑' : '↓'}
              <div className="text-sm mt-2 opacity-50">
                {formatSteps(feedback === 'increment' ? -currentMovement : currentMovement)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Edit Modal */}
      <AnimatePresence>
        {isEditingTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEditingTarget(false);
                setTempTarget(targetValue.toString());
              }
            }}
          >
            <form 
              onSubmit={handleTargetSubmit}
              className="bg-white rounded-lg p-6 shadow-xl min-w-[300px]"
            >
              <h2 className="text-xl font-bold mb-4">Set Target Value</h2>
              <input
                type="number"
                min="1"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4 text-lg"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTarget(false);
                    setTempTarget(targetValue.toString());
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hint */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full">
        Tap or swipe up to increment • Swipe down to decrement • Tap counter to edit target
      </div>
    </div>
  );
}; 