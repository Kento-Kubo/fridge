import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import "./App.css";
import App from "./App.tsx";

registerSW({ immediate: true });

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("RootErrorBoundary", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <main className="main">
            <p className="banner banner-error">
              画面の読み込みでエラーが発生しました。アプリを再読み込みしてください。
            </p>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
