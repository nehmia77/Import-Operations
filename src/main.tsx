import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = {error: null as Error | null};
  static getDerivedStateFromError(error: Error) {
    return {error};
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{fontFamily: 'sans-serif', padding: 24, maxWidth: 560, margin: '40px auto'}}>
        <h1 style={{fontSize: 18, fontWeight: 700}}>Something went wrong</h1>
        <p style={{fontSize: 14, color: '#475569'}}>
          Please press Ctrl + Shift + R to refresh. If it stays like this, send this message to your developer:
        </p>
        <pre style={{whiteSpace: 'pre-wrap', background: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 12}}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
