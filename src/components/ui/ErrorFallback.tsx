"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Clock, WifiOff } from "lucide-react";

// ═══════════════════════════════════════════════════════
// OHANG — Unified Error Fallback Component
// Handles rate-limit, network, server, and validation errors.
// ═══════════════════════════════════════════════════════

type ErrorType = "rate_limit" | "server" | "network" | "validation" | "vision_fallback";

interface ErrorFallbackProps {
    type: ErrorType;
    message?: string;
    retryAfterMs?: number;
    onRetry?: () => void;
    className?: string;
}

const ERROR_CONFIG: Record<ErrorType, {
    icon: typeof AlertTriangle;
    title: string;
    color: string;
    defaultMessage: string;
}> = {
    rate_limit: {
        icon: Clock,
        title: "운기 충전 중",
        color: "#f59e0b",
        defaultMessage: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    },
    server: {
        icon: AlertTriangle,
        title: "서버 점검 중",
        color: "#ef4444",
        defaultMessage: "서버가 일시적으로 불안정합니다.",
    },
    network: {
        icon: WifiOff,
        title: "연결 오류",
        color: "#8b5cf6",
        defaultMessage: "네트워크 연결을 확인해주세요.",
    },
    validation: {
        icon: AlertTriangle,
        title: "입력 오류",
        color: "#f97316",
        defaultMessage: "입력 정보를 확인해주세요.",
    },
    vision_fallback: {
        icon: AlertTriangle,
        title: "이미지 분석 제한",
        color: "#6366f1",
        defaultMessage: "이미지 분석에 실패했습니다. 사주 데이터 기반으로 추정 결과를 제공합니다.",
    },
};

export default function ErrorFallback({
    type,
    message,
    retryAfterMs,
    onRetry,
    className = "",
}: ErrorFallbackProps) {
    const config = ERROR_CONFIG[type];
    const Icon = config.icon;

    return (
        <motion.div
            className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center ${className}`}
            style={{
                background: `radial-gradient(ellipse at center, ${config.color}08, transparent)`,
                border: `1px solid ${config.color}15`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${config.color}10` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <Icon size={24} style={{ color: config.color }} />
            </motion.div>

            <h3 className="text-base font-semibold text-white mb-1.5">
                {config.title}
            </h3>
            <p className="text-sm text-white/40 max-w-xs mb-5">
                {message || config.defaultMessage}
            </p>

            {retryAfterMs && (
                <p className="text-xs text-white/25 mb-3">
                    {Math.ceil(retryAfterMs / 1000)}초 후 재시도 가능
                </p>
            )}

            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110 active:scale-[0.97]"
                    style={{
                        backgroundColor: `${config.color}15`,
                        color: config.color,
                        border: `1px solid ${config.color}25`,
                    }}
                >
                    <RefreshCw size={14} />
                    다시 시도
                </button>
            )}
        </motion.div>
    );
}
