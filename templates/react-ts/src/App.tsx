import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>zero-setup-biome</h1>
      <p>React + TypeScript + Vite + Biome</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
      <p className="hint">
        Run <code>npm run lint</code> to check your code with Biome
      </p>
    </div>
  );
}

export default App;
