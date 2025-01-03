import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCounters } from '../context/CounterContext';

interface CounterProps {
  targetValue: number;
  onTargetChange: (newTarget: number) => void;
}

const Counter = memo(({ targetValue, onTargetChange }: CounterProps) => {
  const { counters, activeCounterIndex, updateCounter } = useCounters();
  const activeCounter = counters[activeCounterIndex];
  const [feedback, setFeedback] = useState<'increment' | 'decrement' | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetValue.toString());
  const counterDisplayRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = 50;
  
  const progress = Math.min((activeCounter.count / targetValue) * 100, 100);

  const calculateSteps = useCallback((distance: number): number => {
    const base = 1;
    const growthRate = 1.15;
    return Math.floor(base * Math.pow(growthRate, Math.abs(distance) / swipeThreshold));
  }, [swipeThreshold]);

  const handleIncrement = useCallback((amount: number = 1) => {
    if (isEditingTarget) return;
    const newCount = Math.min(activeCounter.count + amount, targetValue);
    if (newCount !== activeCounter.count) {
      updateCounter(activeCounter.id, { count: newCount });
      setFeedback('increment');
      setTimeout(() => setFeedback(null), 200);
    }
  }, [activeCounter.count, activeCounter.id, isEditingTarget, targetValue, updateCounter]);

  const handleDecrement = useCallback((amount: number = 1) => {
    if (isEditingTarget) return;
    const newCount = Math.max(activeCounter.count - amount, 0);
    if (newCount !== activeCounter.count) {
      updateCounter(activeCounter.id, { count: newCount });
      setFeedback('decrement');
      setTimeout(() => setFeedback(null), 200);
    }
  }, [activeCounter.count, activeCounter.id, isEditingTarget, updateCounter]);

  const handleTargetSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newTarget = parseInt(tempTarget);
    if (!isNaN(newTarget) && newTarget > 0) {
      onTargetChange(newTarget);
      setIsEditingTarget(false);
    }
  }, [onTargetChange, tempTarget]);

  const handleCounterClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTarget(true);
  }, []);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setIsEditingTarget(false);
      setTempTarget(targetValue.toString());
    }
  }, [targetValue]);

  // Memoize the progress bar animation configuration
  const progressBarAnimation = {
    initial: { height: 0, top: 0 },
    animate: { height: `${progress}%`, top: `${100 - progress}%` },
    transition: { 
      height: { duration: 0.3 },
      top: { duration: 0.3 }
    }
  };

  return (
    <div 
      className="h-screen w-full relative bg-gray-100 touch-none select-none"
      onClick={() => !isEditingTarget && handleIncrement()}
    >
      {/* Progress Bar Container */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute w-full bg-blue-500"
          {...progressBarAnimation}
        />
      </div>
      
      {/* Counter Display */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center text-4xl font-bold transition-colors duration-200 ${
          feedback === 'increment' ? 'text-green-500' : 
          feedback === 'decrement' ? 'text-red-500' : 
          'text-black'
        }`}
      >
        <div 
          ref={counterDisplayRef}
          className="bg-white/80 px-6 py-3 rounded-lg shadow-lg cursor-pointer"
          onClick={handleCounterClick}
        >
          <span>{activeCounter.count}</span>
          <span className="text-gray-400"> / {targetValue}</span>
        </div>
      </div>

      {/* Target Edit Modal */}
      <AnimatePresence>
        {isEditingTarget && (
          <motion.div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            onClick={handleModalClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form 
              onSubmit={handleTargetSubmit}
              className="bg-white rounded-lg p-6 shadow-xl min-w-[300px]"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hint */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full">
        Tap or swipe up to increment • Swipe down to decrement • Tap counter to edit target
      </div>
    </div>
  );
});

Counter.displayName = 'Counter';

export { Counter }; 