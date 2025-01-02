import { useState } from 'react';
import { Counter } from './components/Counter';
import { CounterProvider } from './context/CounterContext';
import { CounterContainer } from './components/CounterContainer';

function App() {
  return (
    <CounterProvider>
      <CounterContainer />
    </CounterProvider>
  );
}

export default App;
