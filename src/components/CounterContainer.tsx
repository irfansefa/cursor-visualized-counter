import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useCounters } from '../context/CounterContext';
import { Counter } from './Counter';
import { useState, useRef } from 'react';

export const CounterContainer = () => {
  const { counters, activeCounterIndex, setActiveCounterIndex, addCounter, updateCounter } = useCounters();
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const activeCounter = counters[activeCounterIndex];
  const containerRef = useRef(null);

  useGesture({
    onDrag: ({ movement: [mx], direction: [dx], active, distance, velocity: [vx] }) => {
      // Update drag position for animation
      setDragX(active ? mx : 0);
      setIsDragging(active);

      // Handle horizontal swipe for counter switching
      if (!active && Math.abs(mx) > 100 && Math.abs(vx) > 0.1) {
        if (mx > 0 && activeCounterIndex > 0) {
          // Swipe right -> previous counter
          setActiveCounterIndex(activeCounterIndex - 1);
        } else if (mx < 0 && activeCounterIndex < counters.length - 1) {
          // Swipe left -> next counter
          setActiveCounterIndex(activeCounterIndex + 1);
        }
      }
    }
  }, {
    target: containerRef,
    drag: {
      filterTaps: true,
      threshold: 5,
    }
  });

  const handleTargetChange = (newTarget: number) => {
    updateCounter(activeCounter.id, { targetValue: newTarget });
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
      scale: 0.95
    })
  };

  const swipeTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Gesture Handler Container */}
      <div ref={containerRef} className="h-full w-full">
        {/* Current Counter */}
        <AnimatePresence initial={false} custom={dragX > 0 ? -1 : 1}>
          <motion.div
            key={activeCounter.id}
            className="h-full w-full absolute inset-0"
            custom={dragX > 0 ? -1 : 1}
            variants={slideVariants}
            initial="enter"
            animate={isDragging ? { x: dragX, opacity: 1 } : "center"}
            exit="exit"
            transition={swipeTransition}
          >
            <Counter
              targetValue={activeCounter.targetValue}
              onTargetChange={handleTargetChange}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Counter Navigation Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
        {counters.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === activeCounterIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            animate={{
              scale: index === activeCounterIndex ? 1.2 : 1,
              opacity: index === activeCounterIndex ? 1 : 0.5
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        ))}
      </div>

      {/* Add Counter Button */}
      <button
        onClick={addCounter}
        className="absolute bottom-20 right-4 bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-blue-600 transition-colors"
      >
        +
      </button>

      {/* Navigation Hints */}
      {counters.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full">
          {activeCounterIndex > 0 && <span>← Previous</span>}
          {activeCounterIndex > 0 && activeCounterIndex < counters.length - 1 && <span> • </span>}
          {activeCounterIndex < counters.length - 1 && <span>Next →</span>}
        </div>
      )}
    </div>
  );
}; 