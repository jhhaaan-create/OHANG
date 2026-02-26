import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════
// OHANG Result Fetcher (Edge-Optimized, Lazy Init)
// ═══════════════════════════════════════════════════════

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (_client) return _client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('FATAL: Supabase credentials missing for result fetch.');
    }

    _client = createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: { 'x-application-name': 'ohang-sre-v1' },
        },
    });
    return _client;
}

export async function getCachedResultById(id: string) {
    try {
        const { data, error } = await getClient()
            .from('ai_cache')
            .select('result_json')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Result Fetch Error:', error);
            return null;
        }

        return data.result_json;
    } catch (err) {
        console.error('Unexpected DB Error:', err);
        return null;
    }
}
