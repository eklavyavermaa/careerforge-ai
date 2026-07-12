import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-semibold mb-1">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            An unexpected error occurred. Reloading the page usually fixes this.
          </p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          {this.state.error && (
            <details className="mt-6 max-w-xl text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Show error details
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-left text-xs text-danger whitespace-pre-wrap">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
                {this.state.info?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
