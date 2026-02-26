#!/usr/bin/env node

/**
 * OHANG — Supabase RLS 감사 스크립트
 *
 * 마이그레이션 SQL 파일에서 CREATE TABLE 시 RLS 활성화 여부를 검사합니다.
 * 또한 Supabase 클라이언트 사용 시 service_role 키 오용을 탐지합니다.
 *
 * 실행: npx tsx scripts/audit-rls.ts
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

// ── 타입 ─────────────────────────────────────────────────
interface RLSViolation {
    file: string;
    line: number;
    rule: string;
    snippet: string;
}

// ── 1) SQL 마이그레이션 파일 RLS 검사 ────────────────────
function auditSQLMigrations(rootDir: string): RLSViolation[] {
    const violations: RLSViolation[] = [];
    const sqlDir = join(rootDir, "supabase", "migrations");

    let files: string[] = [];
    try {
        files = readdirSync(sqlDir).filter((f) => f.endsWith(".sql"));
    } catch {
        // 마이그레이션 폴더가 아직 없으면 스킵
        return violations;
    }

    for (const fileName of files) {
        const filePath = join(sqlDir, fileName);
        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const rel = relative(rootDir, filePath);

        // CREATE TABLE 찾기
        const tableNames: Array<{ name: string; line: number }> = [];

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(
                /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/i
            );
            if (match) {
                tableNames.push({ name: match[1], line: i + 1 });
            }
        }

        // 각 테이블에 대해 ALTER TABLE ... ENABLE ROW LEVEL SECURITY 가 있는지 확인
        for (const table of tableNames) {
            const rlsPattern = new RegExp(
                `ALTER\\s+TABLE\\s+(?:public\\.)?${table.name}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
                "i"
            );
            if (!rlsPattern.test(content)) {
                violations.push({
                    file: rel,
                    line: table.line,
                    rule: `테이블 '${table.name}'에 RLS가 활성화되지 않음`,
                    snippet: lines[table.line - 1].trim().slice(0, 80),
                });
            }

            // RLS 정책(POLICY)이 하나 이상 있는지 확인
            const policyPattern = new RegExp(
                `CREATE\\s+POLICY\\s+.+ON\\s+(?:public\\.)?${table.name}`,
                "i"
            );
            if (!policyPattern.test(content)) {
                violations.push({
                    file: rel,
                    line: table.line,
                    rule: `테이블 '${table.name}'에 RLS 정책(POLICY)이 없음`,
                    snippet: lines[table.line - 1].trim().slice(0, 80),
                });
            }
        }
    }

    return violations;
}

// ── 2) 클라이언트 코드에서 service_role 오용 검사 ────────
function auditServiceRoleUsage(rootDir: string): RLSViolation[] {
    const violations: RLSViolation[] = [];
    const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
    const EXCLUDED_DIRS = new Set([
        "node_modules",
        ".next",
        ".git",
        "dist",
        "build",
        "scripts",
    ]);

    function collectFiles(dir: string): string[] {
        const files: string[] = [];
        try {
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
        } catch {
            // 디렉토리 접근 불가 시 스킵
        }
        return files;
    }

    const dangerousPatterns = [
        {
            name: "클라이언트 코드에서 SERVICE_ROLE_KEY 사용",
            pattern: /SUPABASE_SERVICE_ROLE_KEY/g,
            // app/ 또는 components/ 에서만 위험 — lib/이나 api route는 허용
            allowedPaths: [/[\\/]api[\\/]/, /[\\/]lib[\\/]/, /[\\/]utils[\\/]/],
        },
        {
            name: "supabaseAdmin을 클라이언트 컴포넌트에서 import",
            pattern: /import\s+.*supabaseAdmin/g,
            allowedPaths: [/[\\/]api[\\/]/, /[\\/]lib[\\/]/],
        },
        {
            name: ".rpc() 호출 시 security_definer 우회 가능성",
            pattern: /\.rpc\s*\(/g,
            allowedPaths: [], // 모든 곳에서 경고
        },
    ];

    const files = collectFiles(rootDir);

    for (const filePath of files) {
        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const rel = relative(rootDir, filePath);

        for (const { name, pattern, allowedPaths } of dangerousPatterns) {
            // 허용 경로면 스킵
            if (allowedPaths.some((ap) => ap.test(filePath))) continue;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trimStart().startsWith("//")) continue;

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

const sqlViolations = auditSQLMigrations(rootDir);
const codeViolations = auditServiceRoleUsage(rootDir);
const all = [...sqlViolations, ...codeViolations];

if (all.length === 0) {
    console.log("\n✅ RLS 감사 통과 — 모든 테이블에 RLS가 적용되어 있습니다.\n");
} else {
    console.log(`\n🚨 ${all.length}건의 RLS 위반 항목이 발견되었습니다:\n`);

    for (const v of all) {
        console.log(`  ❌ ${v.file}:${v.line}`);
        console.log(`     규칙: ${v.rule}`);
        console.log(`     코드: ${v.snippet}`);
        console.log();
    }

    process.exit(1);
}
