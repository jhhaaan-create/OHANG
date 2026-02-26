"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useState, useCallback, useRef } from "react";
import type { z } from "zod";

// ═══════════════════════════════════════════════════════
// OHANG — Unified Streaming Hook
// Wraps @ai-sdk/react experimental_useObject for all features.
// Handles loading, error, rate-limit, and haptic triggers.
// ═══════════════════════════════════════════════════════

type ErrorState = {
    type: "rate_limit" | "server" | "network" | "validation";
    message: string;
    retryAfterMs?: number;
};

interface UseStreamingResultOptions<T extends z.ZodType> {
    api: string;
    schema: T;
    onComplete?: (result: z.infer<T>) => void;
    onError?: (error: ErrorState) => void;
}

export function useStreamingResult<T extends z.ZodType>({
    api,
    schema,
    onComplete,
    onError,
}: UseStreamingResultOptions<T>) {
    const [error, setError] = useState<ErrorState | null>(null);
    const completeCbRef = useRef(onComplete);
    completeCbRef.current = onComplete;

    const { object, submit, isLoading, stop } = useObject({
        api,
        schema,
        onFinish: (event: { object: unknown }) => {
            if (event.object) {
                completeCbRef.current?.(event.object as z.infer<T>);
            }
        },
        onError: (err: Error) => {
            const msg = err.message || "Unknown error";
            let errorState: ErrorState;

            if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
                errorState = {
                    type: "rate_limit",
                    message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                    retryAfterMs: 60000,
                };
            } else if (msg.includes("503") || msg.toLowerCase().includes("unavailable")) {
                errorState = {
                    type: "server",
                    message: "서버 점검 중입니다. 잠시 후 다시 시도해주세요.",
                };
            } else if (msg.includes("400") || msg.toLowerCase().includes("invalid")) {
                errorState = {
                    type: "validation",
                    message: "입력 형식이 올바르지 않습니다.",
                };
            } else {
                errorState = {
                    type: "network",
                    message: "네트워크 오류가 발생했습니다.",
                };
            }

            setError(errorState);
            onError?.(errorState);
        },
    });

    const request = useCallback(
        (body: Record<string, unknown>) => {
            setError(null);
            submit(body);
        },
        [submit]
    );

    const clearError = useCallback(() => setError(null), []);

    return {
        data: object as Partial<z.infer<T>> | undefined,
        isLoading,
        error,
        request,
        stop,
        clearError,
    };
}
