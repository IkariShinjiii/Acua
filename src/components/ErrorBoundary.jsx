import React from 'react';
import { AlertTriangle } from 'lucide-react';

// A render-time throw anywhere in the tree (a malformed Supabase row, a
// null field the UI didn't expect, etc.) would otherwise unmount the
// entire app to a blank white screen with no recovery path — the same
// failure class as the earlier "white screen on Vercel" bug, just
// triggered by a render error instead of a client-init error. This is
// the one kind of component that must be a class (no hook equivalent
// exists for getDerivedStateFromError/componentDidCatch).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error in the app tree:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sand flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl text-on-surface">Something went wrong</h2>
            <p className="text-sm text-on-surface-variant">
              This page hit an unexpected error. Reloading usually fixes it.
            </p>
            <button onClick={this.handleReload} className="btn-terracotta w-full justify-center">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
