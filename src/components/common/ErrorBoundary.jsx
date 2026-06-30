import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

const LOG_KEY = 'alpharank:error-events';

function reportClientError(error, errorInfo, incidentId) {
  const event = {
    incidentId,
    message: error?.message || 'Unknown UI error',
    stack: error?.stack || null,
    componentStack: errorInfo?.componentStack || null,
    release: import.meta.env.VITE_APP_VERSION || 'local',
    path: window.location.pathname,
    ts: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem(LOG_KEY) || '[]');
    window.localStorage.setItem(LOG_KEY, JSON.stringify([event, ...existing].slice(0, 20)));
  } catch {
    // Local error logging should never block the recovery screen.
  }

  console.error('[AlphaRank incident]', event);
}

export default class ErrorBoundary extends Component {
  state = {
    error: null,
    incidentId: null,
  };

  static getDerivedStateFromError(error) {
    return {
      error,
      incidentId: `ui-${Date.now().toString(36)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    reportClientError(error, errorInfo, this.state.incidentId);
  }

  handleReset = () => {
    this.setState({ error: null, incidentId: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-300">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-100">Workspace paused</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                AlphaRank caught a runtime error and logged an incident locally so the rest of the page can recover cleanly.
              </p>
              <div className="mt-3 rounded-lg border border-navy-600 bg-navy-850 px-3 py-2 font-mono text-xs text-slate-400">
                Incident: {this.state.incidentId}
              </div>
            </div>
          </div>
          <button type="button" className="btn-primary inline-flex items-center justify-center gap-2" onClick={this.handleReset}>
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }
}
