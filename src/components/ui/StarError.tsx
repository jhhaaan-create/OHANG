'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════
// OHANG SRE: Global Error Boundary
// Catches DB crashes gracefully with Mystic Theme
// ═══════════════════════════════════════════════════════

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    errorMsg: string;
}

export class StarError extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMsg: '' };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, errorMsg: error.message };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to Sentry or Vercel Analytics here
        console.error("Critical System Failure:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0F0F1A] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] z-0" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="z-10 max-w-md glass-card p-10 rounded-2xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
                    >
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-6" />

                        <h1 className="text-3xl font-heading font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-red-500">
                            The Stars Are Too Crowded
                        </h1>

                        <p className="text-white/60 mb-8 leading-relaxed">
                            Universal traffic congestion detected. <br />
                            Millions of souls are aligning at once. <br />
                            Please wait for the cosmos to clear.
                        </p>

                        <button
                            onClick={this.handleRetry}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                            <span>Retry Ritual</span>
                        </button>

                        <div className="mt-6 text-xs text-white/20 font-mono">
                            Error Code: COSMIC_TIMEOUT_503
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
