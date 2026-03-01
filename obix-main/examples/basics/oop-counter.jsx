// Class Component Example
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
