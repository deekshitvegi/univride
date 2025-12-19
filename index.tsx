import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Lazy load App so import errors are caught by ErrorBoundary
const App = React.lazy(() => import('./App'));

const rootElement = document.getElementById('root');

// --- Error Boundary Component ---
interface Props {
  children?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#7f1d1d', background: '#fef2f2', fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Something went wrong</h1>
            <p style={{ marginBottom: '20px' }}>The application encountered an error.</p>
            <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '15px', borderRadius: '8px', overflow: 'auto', maxWidth: '90%', textAlign: 'left', fontSize: '12px' }}>
                {this.state.error?.message}
            </pre>
            <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: '20px', padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
                Reload Application
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Loading Component ---
const LoadingFallback = () => (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#3b82f6' }}>
        <svg className="animate-spin" style={{ width: '40px', height: '40px', marginBottom: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 style={{ fontWeight: 'bold', fontSize: '18px' }}>Initializing...</h2>
    </div>
);

// --- Raw Startup Error Handler ---
const renderStartupError = (error: any) => {
    if (!rootElement) return;
    rootElement.innerHTML = `
    <div style="padding: 20px; color: #7f1d1d; background: #fef2f2; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 10px;">⚠️ Startup Failed</h1>
        <p style="margin-bottom: 20px;">Could not initialize the app.</p>
        <pre style="background: rgba(0,0,0,0.05); padding: 15px; border-radius: 8px; overflow: auto; max-width: 90%; text-align: left;">${error?.message || error}</pre>
    </div>
    `;
};

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
                <App />
            </Suspense>
        </ErrorBoundary>
      </React.StrictMode>
    );
} catch (e) {
    renderStartupError(e);
}