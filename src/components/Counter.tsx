import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCounters } from '../context/CounterContext';

const AlertDialog = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

AlertDialog.displayName = 'AlertDialog';

const PREDEFINED_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' }
];

interface CounterProps {
  targetValue: number;
  onTargetChange: (newTarget: number) => void;
}

const Counter = memo(({ targetValue, onTargetChange }: CounterProps) => {
  const { counters, activeCounterIndex, updateCounter, removeCounter } = useCounters();
  const activeCounter = counters[activeCounterIndex];
  const [feedback, setFeedback] = useState<'increment' | 'decrement' | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetValue.toString());
  const [tempName, setTempName] = useState(activeCounter.name);
  const [tempColor, setTempColor] = useState(activeCounter.color);
  const counterDisplayRef = useRef<HTMLDivElement>(null);
  
  const progress = Math.min((activeCounter.count / targetValue) * 100, 100);

  const handleIncrement = useCallback((amount: number = 1) => {
    if (isEditingTarget) return;
    const newCount = Math.min(activeCounter.count + amount, targetValue);
    if (newCount !== activeCounter.count) {
      updateCounter(activeCounter.id, { count: newCount });
      setFeedback('increment');
      setTimeout(() => setFeedback(null), 200);
    }
  }, [activeCounter.count, activeCounter.id, isEditingTarget, targetValue, updateCounter]);

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

  const handleSettingsSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateCounter(activeCounter.id, {
      name: tempName,
      color: tempColor
    });
    setIsEditingSettings(false);
  }, [activeCounter.id, tempName, tempColor, updateCounter]);

  const handleDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    removeCounter(activeCounter.id);
    setIsDeleteDialogOpen(false);
    setIsEditingSettings(false);
  }, [activeCounter.id, removeCounter]);

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
      className="h-screen w-full relative bg-gray-100 dark:bg-gray-900 touch-none select-none"
      onClick={() => !isEditingTarget && !isEditingSettings && handleIncrement()}
    >
      {/* Progress Bar Container */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute w-full"
          style={{ backgroundColor: activeCounter.color }}
          {...progressBarAnimation}
        />
      </div>
      
      {/* Counter Display */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center text-4xl font-bold transition-colors duration-200 ${
          feedback === 'increment' ? 'text-green-500' : 
          feedback === 'decrement' ? 'text-red-500' : 
          'text-gray-900 dark:text-white'
        }`}
      >
        <div className="text-2xl mb-2 text-gray-900 dark:text-white">{activeCounter.name}</div>
        <div 
          ref={counterDisplayRef}
          className="bg-white/80 dark:bg-gray-800/80 px-6 py-3 rounded-lg shadow-lg cursor-pointer"
          onClick={handleCounterClick}
        >
          <span>{activeCounter.count}</span>
          <span className="text-gray-400 dark:text-gray-500"> / {targetValue}</span>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditingSettings(true);
          setTempName(activeCounter.name);
          setTempColor(activeCounter.color);
        }}
        className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isEditingSettings && (
          <motion.div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEditingSettings(false);
                setTempName(activeCounter.name);
                setTempColor(activeCounter.color);
              }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form 
              onSubmit={handleSettingsSubmit}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl min-w-[300px]"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Counter Settings</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Counter Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Progress Bar Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PREDEFINED_COLORS.map(({ name, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTempColor(value)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        tempColor === value 
                          ? 'border-gray-900 dark:border-white scale-110' 
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: value }}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSettings(false);
                      setTempName(activeCounter.name);
                      setTempColor(activeCounter.color);
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>

                {counters.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Delete Counter
                  </button>
                )}
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl min-w-[300px]"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Set Target Value</h2>
              <input
                type="number"
                min="1"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTarget(false);
                    setTempTarget(targetValue.toString());
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hint */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full">
        Tap or swipe up to increment • Swipe down to decrement • Tap counter to edit target
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Counter"
        description={`Are you sure you want to delete "${activeCounter.name}"? This action cannot be undone.`}
      />
    </div>
  );
});

Counter.displayName = 'Counter';

export { Counter }; 