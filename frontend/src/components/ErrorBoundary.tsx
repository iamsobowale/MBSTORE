import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches render errors so a single broken section doesn't blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "var(--space-16)", textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <p style={{ color: "var(--color-muted)" }}>
            Please refresh the page. If the problem persists, try again later.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
