#!/usr/bin/env node

/**
 * OHANG — 환경변수 하드코딩 감사 스크립트
 *
 * 소스코드에서 시크릿 키가 하드코딩된 부분을 탐지합니다.
 * 실행: npx tsx scripts/audit-env.ts
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, relative } from "path";

// ── 탐지 패턴 ─────────────────────────────────────────────
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // Supabase
  {
    name: "Supabase URL 하드코딩",
    pattern: /https:\/\/[a-z0-9]+\.supabase\.co/gi,
  },
  {
    name: "Supabase Anon/Service Key 하드코딩",
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+/g,
  },
  // OpenAI
  {
    name: "OpenAI API Key 하드코딩",
    pattern: /sk-[A-Za-z0-9]{20,}/g,
  },
  // Stripe
  {
    name: "Stripe Secret Key 하드코딩",
    pattern: /sk_(test|live)_[A-Za-z0-9]{20,}/g,
  },
  {
    name: "Stripe Publishable Key 하드코딩",
    pattern: /pk_(test|live)_[A-Za-z0-9]{20,}/g,
  },
  {
    name: "Stripe Webhook Secret 하드코딩",
    pattern: /whsec_[A-Za-z0-9]{20,}/g,
  },
  // Generic secrets
  {
    name: "Bearer 토큰 하드코딩",
    pattern: /["']Bearer\s+[A-Za-z0-9._-]{20,}["']/g,
  },
  {
    name: "password/secret 할당 하드코딩",
    pattern: /(?:password|secret|api_key|apikey)\s*[:=]\s*["'][^"']{8,}["']/gi,
  },
];

// ── process.env 미사용 감지 ──────────────────────────────
const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

// ── 스캔 대상 확장자 ─────────────────────────────────────
const TARGET_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

// ── 제외 디렉토리 ────────────────────────────────────────
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".vercel",
  "scripts", // 감사 스크립트 자체는 제외
]);

// ── 파일 수집 ────────────────────────────────────────────
function collectFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (TARGET_EXTENSIONS.has(extname(entry))) {
      files.push(fullPath);
    }
  }

  return files;
}

// ── 메인 감사 로직 ───────────────────────────────────────
interface Violation {
  file: string;
  line: number;
  rule: string;
  snippet: string;
}

function audit(rootDir: string): Violation[] {
  const violations: Violation[] = [];
  const files = collectFiles(rootDir);

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relative(rootDir, filePath);

    // 패턴 매칭
    for (const { name, pattern } of SECRET_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        // .env.example 파일 내부 참조용 문자열은 제외
        if (lines[i].includes("process.env")) continue;
        if (lines[i].trimStart().startsWith("//")) continue;
        if (lines[i].trimStart().startsWith("*")) continue;

        const cloned = new RegExp(pattern.source, pattern.flags);
        if (cloned.test(lines[i])) {
          violations.push({
            file: rel,
            line: i + 1,
            rule: name,
            snippet: lines[i].trim().slice(0, 80),
          });
        }
      }
    }
  }

  return violations;
}

// ── 실행 ─────────────────────────────────────────────────
const rootDir = join(import.meta.dirname ?? process.cwd(), "..");
const violations = audit(rootDir);

if (violations.length === 0) {
  console.log("\n✅ 하드코딩된 시크릿이 발견되지 않았습니다.\n");
} else {
  console.log(
    `\n🚨 ${violations.length}건의 하드코딩 의심 항목이 발견되었습니다:\n`
  );

  for (const v of violations) {
    console.log(`  ❌ ${v.file}:${v.line}`);
    console.log(`     규칙: ${v.rule}`);
    console.log(`     코드: ${v.snippet}`);
    console.log();
  }

  process.exit(1);
}
