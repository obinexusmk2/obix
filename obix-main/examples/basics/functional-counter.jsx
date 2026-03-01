
// Function Component Example
import { useState } from 'obix';

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <style jsx>{`
        .counter {
          font-family: sans-serif;
          text-align: center;
          padding: 2rem;
        }
        button {
          margin: 0 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
}