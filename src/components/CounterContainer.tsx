import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useCounters } from '../context/CounterContext';
import { Counter } from './Counter';
import { useState, useRef, useCallback, memo } from 'react';

const CounterDot = memo(({ isActive }: { isActive: boolean }) => (
  <motion.div
    className={`w-2 h-2 rounded-full ${
      isActive ? 'bg-blue-500' : 'bg-gray-300'
    }`}
    animate={{
      scale: isActive ? 1.2 : 1,
      opacity: isActive ? 1 : 0.5
    }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  />
));

CounterDot.displayName = 'CounterDot';

const AddButton = memo(({ onClick }: { onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    className="absolute bottom-20 right-4 bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-blue-600 transition-colors"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  >
    +
  </motion.button>
));

AddButton.displayName = 'AddButton';

const NavigationHints = memo(({ activeIndex, total }: { activeIndex: number; total: number }) => {
  if (total <= 1) return null;
  
  return (
    <motion.div 
      className="absolute top-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {activeIndex > 0 && <span>← Previous</span>}
      {activeIndex > 0 && activeIndex < total - 1 && <span> • </span>}
      {activeIndex < total - 1 && <span>Next →</span>}
    </motion.div>
  );
});

NavigationHints.displayName = 'NavigationHints';

interface DragState {
  movement: [number, number];
  velocity: [number, number];
  active: boolean;
  last: boolean;
}

export const CounterContainer = () => {
  const { counters, activeCounterIndex, setActiveCounterIndex, addCounter, updateCounter } = useCounters();
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const activeCounter = counters[activeCounterIndex];
  const containerRef = useRef(null);
  const swipeThreshold = 50;

  const calculateSteps = useCallback((distance: number): number => {
    const base = 1;
    const growthRate = 1.15;
    return Math.floor(base * Math.pow(growthRate, Math.abs(distance) / swipeThreshold));
  }, [swipeThreshold]);

  const handleTargetChange = useCallback((newTarget: number) => {
    updateCounter(activeCounter.id, { targetValue: newTarget });
  }, [activeCounter.id, updateCounter]);

  const bind = useGesture({
    onDrag: useCallback(({ movement: [mx, my], velocity: [vx, vy], active, last }: DragState) => {
      const isHorizontal = Math.abs(mx) > Math.abs(my);

      if (isHorizontal) {
        setDragX(active ? mx : 0);
        setIsDragging(active);

        if (last && Math.abs(mx) > 100 && Math.abs(vx) > 0.1) {
          if (mx > 0 && activeCounterIndex > 0) {
            setActiveCounterIndex(activeCounterIndex - 1);
          } else if (mx < 0 && activeCounterIndex < counters.length - 1) {
            setActiveCounterIndex(activeCounterIndex + 1);
          }
        }
      } else {
        if (last && Math.abs(my) > swipeThreshold) {
          const steps = calculateSteps(my);
          const currentCount = activeCounter.count;
          const newCount = my > 0 
            ? Math.max(currentCount - steps, 0)
            : Math.min(currentCount + steps, activeCounter.targetValue);
          
          if (newCount !== currentCount) {
            updateCounter(activeCounter.id, { count: newCount });
          }
        }
      }
    }, [activeCounter, activeCounterIndex, calculateSteps, counters.length, setActiveCounterIndex, updateCounter])
  }, {
    drag: {
      filterTaps: true,
      threshold: 5,
      preventDefault: true,
    }
  });

  return (
    <div 
      ref={containerRef}
      {...bind()}
      className="relative h-screen w-full overflow-hidden bg-gray-100"
      style={{ touchAction: 'none' }}
    >
      {/* Current Counter */}
      <motion.div
        className="absolute inset-0"
        style={{ x: dragX }}
      >
        <Counter
          targetValue={activeCounter.targetValue}
          onTargetChange={handleTargetChange}
        />
      </motion.div>

      {/* Counter Navigation Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
        {counters.map((_, index) => (
          <CounterDot key={index} isActive={index === activeCounterIndex} />
        ))}
      </div>

      {/* Add Counter Button */}
      <AddButton onClick={addCounter} />

      {/* Navigation Hints */}
      <NavigationHints activeIndex={activeCounterIndex} total={counters.length} />
    </div>
  );
}; 