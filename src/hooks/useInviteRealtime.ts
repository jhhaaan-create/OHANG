"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import haptic from "@/lib/haptics";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════
// Realtime hook — notifies creator when partner completes
// Subscribe to chemistry_invites row changes via Supabase
// ═══════════════════════════════════════════════════════

interface UseInviteRealtimeOptions {
    /** The invite ID to watch */
    inviteId: string;
    /** Called when partner completes their analysis */
    onPartnerComplete: (partnerResultId: string) => void;
    /** Whether to subscribe (false = cleanup only) */
    enabled?: boolean;
}

export function useInviteRealtime({
    inviteId,
    onPartnerComplete,
    enabled = true,
}: UseInviteRealtimeOptions) {
    const callbackRef = useRef(onPartnerComplete);
    callbackRef.current = onPartnerComplete;

    useEffect(() => {
        if (!enabled || !inviteId) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`invite:${inviteId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "chemistry_invites",
                    filter: `id=eq.${inviteId}`,
                },
                (payload) => {
                    const newRow = payload.new as {
                        status: string;
                        partner_result_id: string | null;
                    };

                    if (newRow.status === "completed" && newRow.partner_result_id) {
                        haptic.destiny();
                        toast.success("\ud83d\udc9c Your partner completed their analysis!", {
                            description: "Tap to see your chemistry results",
                            duration: 8000,
                        });
                        callbackRef.current(newRow.partner_result_id);
                    }

                    if (newRow.status === "accepted") {
                        haptic.tap();
                        toast("Your partner opened the invite! \u2728", {
                            duration: 4000,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [inviteId, enabled]);
}
