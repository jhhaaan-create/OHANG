// src/lib/utils/birthDataStore.ts
// Persistent birth data across pages via sessionStorage

const STORAGE_KEY = "ohang_user_data";

export interface BirthData {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    gender: string;
}

export function saveBirthData(data: BirthData): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // sessionStorage unavailable (SSR, private browsing quota)
    }
}

export function loadBirthData(): BirthData | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as BirthData;
    } catch {
        return null;
    }
}

export function buildAnalyzeUrl(data: BirthData): string {
    const params = new URLSearchParams();
    if (data.year) params.set("year", data.year);
    if (data.month) params.set("month", data.month);
    if (data.day) params.set("day", data.day);
    if (data.hour) params.set("hour", data.hour);
    if (data.minute) params.set("minute", data.minute);
    if (data.gender) params.set("gender", data.gender);
    return `/analyze?${params.toString()}`;
}
