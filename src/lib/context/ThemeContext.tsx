'use client';

/**
 * BACKWARD COMPATIBILITY LAYER
 *
 * This file now delegates to the new MoodThemeProvider.
 * Existing components using `useTheme()` and `ThemeProvider` continue to work.
 * New components should import directly from "@/providers/MoodThemeProvider".
 */

import React from 'react';
import {
  MoodThemeProvider,
  useMoodTheme,
  type OhangElement,
} from '@/providers/MoodThemeProvider';
import { ElementType } from '@/lib/constants/archetypes';

// ── Compatibility Hook ───────────────────────────────────
// Maps old useTheme() API → new useMoodTheme() API
export function useTheme() {
  const mood = useMoodTheme();

  return {
    currentElement: (mood.element ?? 'Water') as ElementType,
    setElement: (element: ElementType) => {
      mood.setElement(element as OhangElement);
    },
    // Expose new API for gradual migration
    mood,
  };
}

// ── Compatibility Provider ───────────────────────────────
// Wraps MoodThemeProvider with the old ThemeProvider API
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <MoodThemeProvider>{children}</MoodThemeProvider>;
}
