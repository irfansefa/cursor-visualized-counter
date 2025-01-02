import { createContext, useContext, useEffect, useState } from 'react';

interface Counter {
  id: string;
  count: number;
  targetValue: number;
}

interface CounterContextType {
  counters: Counter[];
  activeCounterIndex: number;
  addCounter: () => void;
  removeCounter: (id: string) => void;
  updateCounter: (id: string, updates: Partial<Counter>) => void;
  setActiveCounterIndex: (index: number) => void;
}

const CounterContext = createContext<CounterContextType | null>(null);

export const useCounters = () => {
  const context = useContext(CounterContext);
  if (!context) {
    throw new Error('useCounters must be used within a CounterProvider');
  }
  return context;
};

export const CounterProvider = ({ children }: { children: React.ReactNode }) => {
  const [counters, setCounters] = useState<Counter[]>(() => {
    const saved = localStorage.getItem('counters');
    return saved ? JSON.parse(saved) : [{ id: '1', count: 0, targetValue: 100 }];
  });
  
  const [activeCounterIndex, setActiveCounterIndex] = useState(0);

  // Persist counters to localStorage
  useEffect(() => {
    localStorage.setItem('counters', JSON.stringify(counters));
  }, [counters]);

  const addCounter = () => {
    const newCounter: Counter = {
      id: Date.now().toString(),
      count: 0,
      targetValue: 100,
    };
    setCounters(prev => [...prev, newCounter]);
    setActiveCounterIndex(counters.length); // Switch to new counter
  };

  const removeCounter = (id: string) => {
    setCounters(prev => {
      const newCounters = prev.filter(counter => counter.id !== id);
      // Adjust active index if necessary
      if (activeCounterIndex >= newCounters.length) {
        setActiveCounterIndex(Math.max(0, newCounters.length - 1));
      }
      return newCounters;
    });
  };

  const updateCounter = (id: string, updates: Partial<Counter>) => {
    setCounters(prev =>
      prev.map(counter =>
        counter.id === id ? { ...counter, ...updates } : counter
      )
    );
  };

  const value = {
    counters,
    activeCounterIndex,
    addCounter,
    removeCounter,
    updateCounter,
    setActiveCounterIndex,
  };

  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
}; 