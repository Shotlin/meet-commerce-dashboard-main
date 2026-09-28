import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Wraps the routed page area (not the shell). A render error inside one page
 * shows this panel instead of unmounting the whole app — the sidebar and
 * header stay usable and the rest of the dashboard keeps working. Mount it
 * with `key={location.pathname}` so navigating away clears the error.
 */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary] page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-sm font-bold text-ink">This page hit an error</h3>
        <p className="text-xs text-status-neutral break-words">
          {this.state.error.message || 'Unexpected error while rendering this page.'}
        </p>
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </Button>
      </div>
    );
  }
}
