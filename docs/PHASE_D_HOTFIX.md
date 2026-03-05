# 🚑 PHASE D: HOTFIX — CSS Evaporation & 401 Upload Recovery

> **Generated**: 2026-03-03
> **Severity**: CRITICAL — Production blocker
> **Target**: Claude Code Agent (automated execution)

---

## DIAGNOSIS

### Bug 1: CSS Styling Evaporation (All pages render raw HTML)

**Root Cause**: Tailwind CSS version mismatch.

The project uses **Tailwind CSS v4.1.18** (`"tailwindcss": "^4"` in package.json) with the v4 PostCSS plugin (`"@tailwindcss/postcss": "^4.1.18"`). However, `src/app/globals.css` uses **Tailwind v3 directives**:

```css
/* ❌ BROKEN — Tailwind v3 syntax, silently ignored by v4 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

In Tailwind v4, there is no `@tailwind` at-rule. The correct import is:

```css
/* ✅ CORRECT — Tailwind v4 syntax */
@import "tailwindcss";
```

The v4 PostCSS plugin silently ignores unknown `@tailwind` directives, producing an empty stylesheet. Result: zero Tailwind classes resolve → raw unstyled HTML.

**Secondary Issue**: `src/app/layout.tsx` has a **duplicate CSS import** — `import "./globals.css"` appears on both line 1 and line 23. Harmless but messy.

### Bug 2: 401 Unauthorized on `/api/upload`

**Root Cause**: `src/app/api/upload/route.ts` line 33-38 performs a strict auth check:

```ts
const user = await getAuthenticatedUser(request);
if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
}
```

Free viral features (Celebrity Match, Couple Face Scan) require image uploads from **unauthenticated users**. The `resolveUserId()` function in `src/lib/ai/cache.ts` already supports anonymous fallback via IP address, but the upload route hard-blocks before reaching it.

**Fix**: Allow anonymous uploads by removing the strict auth gate and using `resolveUserId()` directly for rate limiting. Security is maintained through: file type validation, 5MB size limit, rate limiting (10/min per IP), and filename sanitization — all of which remain intact.

### Bug 3: Blueprint Sync Status

All files from Phase B and Phase C manifests are present:
- ✅ `src/components/ui/ShareViralButton.tsx`
- ✅ `src/app/features/red-flag/page.tsx`
- ✅ `src/app/features/couple-scan/page.tsx`
- ✅ `src/app/features/retro-mode/page.tsx`
- ✅ `src/app/features/celeb-match/page.tsx`
- ✅ `src/app/features/page.tsx`
- ✅ `src/app/pricing/page.tsx`
- ✅ `src/components/layout/BottomNav.tsx`
- ✅ `src/app/api/analyze/red-flag/route.ts`
- ✅ Layout patched with BottomNav + pb-20
- ✅ Checkout route patched with ohang_pro
- ✅ Stripe module patched with ohang_pro_monthly

No missing components detected.

---

## PATCH 1: Fix globals.css (Tailwind v4 Migration)

**File**: `src/app/globals.css`
**Action**: Replace the first 3 lines (Tailwind v3 directives) with the single v4 import.

```css
/* ── REPLACE LINES 1-3 ── */

/* ❌ DELETE THESE: */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ REPLACE WITH: */
@import "tailwindcss";
```

**Full patched file** (lines 1-3 only change, rest stays identical):

```css
@import "tailwindcss";

/* ═══════════════════════════════════════════════════════
   OHANG Dynamic Theme Variables
   Managed by MoodThemeProvider.tsx + ThemeContext.tsx (legacy)
   ═══════════════════════════════════════════════════════ */
:root {
  /* ... rest of file unchanged ... */
}
```

---

## PATCH 2: Fix layout.tsx (Remove Duplicate CSS Import)

**File**: `src/app/layout.tsx`
**Action**: Remove the duplicate `import "./globals.css";` on line 1 (keep only line 23) and remove the Korean comment on line 2.

```tsx
/* ❌ DELETE LINES 1-2: */
import "./globals.css";
// (만약 에러가 나면 import "@/app/globals.css"; 로 변경)

/* ✅ Keep only the import on line 23: */
import "./globals.css";
```

**Result**: The file should start with the JSDoc comment block:

```tsx
/**
 * ROOT LAYOUT — OHANG
 *
 * Integration points:
 * ...
 */
import type { Metadata, Viewport } from "next";
// ... other imports ...
import "./globals.css";
```

---

## PATCH 3: Fix /api/upload (Allow Anonymous Uploads)

**File**: `src/app/api/upload/route.ts`
**Action**: Replace the strict auth gate (lines 32-40) with a soft auth pattern that falls through to `resolveUserId()` for anonymous rate limiting.

```ts
/* ❌ DELETE LINES 32-40: */
// 1. Authentication — REQUIRED
const user = await getAuthenticatedUser(request);
if (!user) {
    return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
    );
}
const userId = resolveUserId(user, request);

/* ✅ REPLACE WITH: */
// 1. Authentication — OPTIONAL (free viral features allow anonymous uploads)
// Security maintained via: file type validation, 5MB limit, rate limiting, filename sanitization
const user = await getAuthenticatedUser(request);
const userId = resolveUserId(user, request);
```

That's it. The `resolveUserId(null, request)` path returns `anon:<ip>` which feeds into the existing rate limiter. All other security guards (file type, size, extension, sanitization) remain intact.

---

## FILE MANIFEST

| # | Action | File | Lines Affected |
|---|--------|------|----------------|
| 1 | PATCH | `src/app/globals.css` | Lines 1-3: Replace `@tailwind` directives with `@import "tailwindcss"` |
| 2 | PATCH | `src/app/layout.tsx` | Lines 1-2: Remove duplicate CSS import + Korean comment |
| 3 | PATCH | `src/app/api/upload/route.ts` | Lines 32-39: Remove strict auth gate, keep soft auth |

## VERIFICATION

After applying patches:

```bash
# 1. Rebuild and check for errors
npm run build

# 2. Start dev server
npm run dev

# 3. Verify CSS renders (landing page should show styled content)
# Open http://localhost:3000 — should see dark theme with violet accents

# 4. Verify upload works without auth
curl -X POST http://localhost:3000/api/upload?filename=test.jpg \
  -H "Content-Type: image/jpeg" \
  --data-binary @/dev/null
# Should return 400 "Empty file" (NOT 401)

# 5. Verify Stripe checkout still works
curl -X POST http://localhost:3000/api/checkout/stripe \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro"}'
# Should return checkout URL or Stripe error (NOT 401/403)
```
