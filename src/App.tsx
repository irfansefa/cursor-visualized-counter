import { useState } from 'react';
import { Counter } from './components/Counter';

function App() {
  const [targetValue, setTargetValue] = useState(100);

  return (
    <Counter 
      targetValue={targetValue} 
      onTargetChange={setTargetValue} 
    />
  );
}

export default App;
