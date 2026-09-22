import { Component } from "react";

// Catches render errors anywhere in the game and shows a themed reload prompt
// instead of a blank screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Shadowbane crashed:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="room-intro-overlay" role="alert">
          <h2>The dungeon shifts unexpectedly...</h2>
          <p>Something went wrong. Reload to resume your quest.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
