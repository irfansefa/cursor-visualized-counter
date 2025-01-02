import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';

interface CounterProps {
  targetValue: number;
  onTargetChange: (newTarget: number) => void;
}

export const Counter = ({ targetValue, onTargetChange }: CounterProps) => {
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState<'increment' | 'decrement' | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetValue.toString());
  const counterDisplayRef = useRef<HTMLDivElement>(null);
  
  const progress = Math.min((count / targetValue) * 100, 100);

  const handleIncrement = () => {
    if (count < targetValue) {
      setCount(prev => prev + 1);
      setFeedback('increment');
      setTimeout(() => setFeedback(null), 300);
    }
  };

  const handleDecrement = () => {
    if (count > 0) {
      setCount(prev => prev - 1);
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
    onDrag: ({ movement: [mx, my], direction: [dx, dy], tap, event }) => {
      if (isEditingTarget) return; // Disable gestures while editing
      
      // Check if the event target is the counter display or its children
      if (event && counterDisplayRef.current?.contains(event.target as Node)) {
        return;
      }
      
      if (tap) {
        handleIncrement();
      } else if (Math.abs(my) > 100) { // Increased minimum swipe distance
        if (dy > 0) { // Swipe down
          handleDecrement();
        } else if (dy < 0) { // Swipe up
          handleIncrement();
        }
      }
    }
  });

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
          scale: feedback ? 1.1 : 1,
          color: feedback === 'increment' ? 'rgb(34, 197, 94)' : feedback === 'decrement' ? 'rgb(239, 68, 68)' : 'rgb(0, 0, 0)'
        }}
        transition={{ duration: 0.2 }}
      >
        <div 
          ref={counterDisplayRef}
          className="bg-white/80 px-6 py-3 rounded-lg shadow-lg cursor-pointer"
          onClick={handleCounterClick}
        >
          <span>{count}</span>
          <span className="text-gray-400"> / {targetValue}</span>
        </div>
      </motion.div>

      {/* Visual Feedback Indicators */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: feedback === 'increment' ? 20 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute left-1/2 transform -translate-x-1/2 ${
              feedback === 'increment' ? 'bottom-1/4' : 'top-1/4'
            } text-2xl`}
          >
            {feedback === 'increment' ? '↑' : '↓'}
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full">
        Tap or swipe up to increment • Swipe down to decrement • Tap counter to edit target
      </div>
    </div>
  );
}; 