import React from 'react';
import { ShieldAlert } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-theme-surface rounded-xl shadow-lg border border-theme-border p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-error-light rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-error-text" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-theme-text tracking-tight">Something went wrong</h1>
              <p className="text-theme-text0">
                The application encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {/* Optional: Show error details in dev mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-theme-bg p-4 rounded-lg overflow-x-auto text-sm text-theme-text2 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="btn btn-primary w-full"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
