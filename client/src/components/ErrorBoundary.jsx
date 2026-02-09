import logger from '@/utils/logger';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                    <div className="max-w-md w-full glass rounded-3xl p-8 border border-rose-500/20 bg-rose-500/5">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-4 bg-rose-500/10 rounded-full">
                                <AlertCircle className="w-12 h-12 text-rose-400" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white text-center mb-2">
                            Something Went Wrong
                        </h1>

                        <p className="text-slate-400 text-center mb-6">
                            The application encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                <p className="text-xs font-mono text-rose-300 mb-2">Error Details:</p>
                                <p className="text-xs font-mono text-slate-400 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-rose-500 hover:bg-rose-400 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Reload Application
                        </button>

                        <p className="text-xs text-slate-500 text-center mt-4">
                            If this problem persists, please contact your system administrator.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
