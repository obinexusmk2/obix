// Original Class Component
import { Component } from 'obix';

class Counter extends Component {
  state = {
    count: 0
  };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  decrement = () => {
    this.setState({ count: this.state.count - 1 });
  };

  render() {
    return (
      <div className="counter">
        <h1>Count: {this.state.count}</h1>
        <button onClick={this.decrement}>-</button>
        <button onClick={this.increment}>+</button>
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
}

// Original Function Component
import { useState } from 'obix';

function CounterFunc() {
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

// ===== TRANSFORMED OUTPUT =====
// Both components get transformed to the same optimized representation

// Compiled output (both class and function components)
import { createOptimizedComponent, useStateMachine } from 'obix/runtime';

// State machine definition (shared between both component types)
const counterStateMachine = {
  initialState: { count: 0 },
  transitions: new Map([
    // Minimized transitions with equivalence classes
    ['increment', (state) => ({ ...state, count: state.count + 1 })],
    ['decrement', (state) => ({ ...state, count: state.count - 1 })]
  ]),
  // Pre-compiled HTML AST with state placeholders
  htmlStructure: {"type":"element","tag":"div","attrs":{"className":"counter"},"children":[
    {"type":"element","tag":"h1","attrs":{},"children":[
      {"type":"text","value":"Count: "},
      {"type":"dynamic","path":"count","id":"dyn1"}
    ]},
    {"type":"element","tag":"button","attrs":{"onClick":"$transition:decrement"},"children":[
      {"type":"text","value":"-"}
    ]},
    {"type":"element","tag":"button","attrs":{"onClick":"$transition:increment"},"children":[
      {"type":"text","value":"+"}
    ]}
  ]},
  // Pre-compiled CSS AST
  cssStructure: {"type":"stylesheet","rules":[
    {"type":"rule","selector":".counter","declarations":{
      "font-family":"sans-serif",
      "text-align":"center",
      "padding":"2rem"
    }},
    {"type":"rule","selector":"button","declarations":{
      "margin":"0 0.5rem",
      "padding":"0.5rem 1rem",
      "font-size":"1.25rem"
    }}
  ]},
  // Optimized equivalence classes
  equivalenceClasses: new Map([
    [0, ["initial", "after_increment", "after_decrement"]]
  ]),
  // Performance metrics from compilation
  metrics: {
    originalStateCount: 3,
    minimizedStateCount: 1,
    originalNodeCount: 12,
    minimizedNodeCount: 7,
    optimizationRatio: 0.58
  }
};

// Exported class component (compiler transforms the class into this)
export const Counter = createOptimizedComponent('Counter', counterStateMachine);

// Exported function component (compiler transforms the function into this)
export const CounterFunc = createOptimizedComponent('CounterFunc', counterStateMachine);

// They become functionally identical with the same internal representation
// due to DOP Adapter and automaton state minimization