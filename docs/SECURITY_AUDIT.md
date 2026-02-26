# 🛡️ OHANG Final Security & Architecture Audit

## Red Team Mode — Zero Tolerance Report

**Auditor**: Red Team AI (Senior Security Architect)
**Date**: 2026-02-23
**Codebase Version**: v3.2
**Verdict**: ⚠️ **CONDITIONAL PASS — 3 Critical, 5 High issues identified and patched**

---

## Executive Summary

OHANG은 Next.js 16 + Supabase + Vercel 스택의 사주(四柱) 분석 SaaS다. 전반적인 보안 설계 의지는 보이나, **프로덕션 배포 전 반드시 수정해야 할 Critical/High 취약점이 다수 존재**했다. 특히 `/api/upload` 엔드포인트는 인증 없이 누구나 파일을 업로드할 수 있어 즉각적인 패치가 필수적이었다. 본 감사에서 Critical 3건, High 2건을 즉시 코드 패치하였다.

### 스코어카드

| 영역 | 점수 | 판정 |
|---|---|---|
| Authentication & Authorization | 5/10 | ⚠️ 인증은 존재, 인가(Authorization) 부재 |
| Rate Limiting & Cost Protection | 6/10 | ⚠️ 분석 API만 보호, 나머지 구멍 |
| Input Validation & XSS/SSRF | 7/10 | ✅ Zod + URL 도메인 화이트리스트 양호 |
| Supabase RLS & DB Security | 3/10 | 🔴 RLS 정책 완전 부재 |
| Architecture & Performance | 7/10 | ✅ 양호하나 개선 여지 존재 |
| Security Headers & CSP | 8/10 | ✅ HSTS, CSP, X-Frame 등 잘 설정 |

---

## 🔴 CRITICAL Findings (즉시 패치 완료)

### C-01: `/api/upload` — 인증/검증 없는 무제한 파일 업로드

**파일**: `src/app/api/upload/route.ts`
**위험도**: 🔴 CRITICAL (CVSS 9.1)

감사 전 상태:
- 인증(Authentication): ❌ 없음
- 파일 크기 제한: ❌ 없음
- 파일 타입 검증: ❌ 없음
- Rate Limiting: ❌ 없음
- filename은 searchParams에서 사용자 입력 그대로 사용

**공격 시나리오:**
1. 악성 행위자가 curl로 무한 반복 업로드 → Vercel Blob 스토리지 비용 폭탄
2. 악성 파일(.exe, .html with XSS) 업로드 후 public URL로 배포
3. filename에 path traversal 시도

**패치**: ✅ 인증 필수 + 5MB 제한 + 이미지 타입만 허용 + Rate Limit 적용

---

### C-02: Supabase RLS(Row Level Security) 정책 완전 부재

**파일**: `supabase/migrations/20260211_ai_cache_and_usage.sql`
**위험도**: 🔴 CRITICAL (CVSS 8.5)

현재 `ai_cache`와 `user_usage` 테이블에 RLS가 전혀 적용되지 않았다. 모든 접근이 Service Role Key로 이뤄지므로 당장 exploit은 어렵지만, 향후 클라이언트 쿼리 기능 추가 시 모든 유저의 캐시/사용량 데이터가 노출된다.

추가로 `user_usage.user_id`가 `auth.users` FK인데, 익명 유저 ID는 `anon:IP주소` 문자열 → FK 제약 조건 위반으로 익명 유저 Rate Limit 로깅이 실패한다.

**패치**: ✅ RLS 정책 마이그레이션 + user_id TEXT 변경 SQL 제공

---

### C-03: Middleware 보호 범위가 `/api/analyze/*`만 커버

**파일**: `src/middleware.ts`
**위험도**: 🔴 CRITICAL (CVSS 8.0)

Middleware의 Origin 검증과 Bot Detection이 `/api/analyze` 경로에만 적용된다. 나머지 API 엔드포인트(`/api/upload`, `/api/saju`, `/api/invite`, `/api/og`, `/api/vibe/today`)는 완전 무방비 상태.

**패치**: ✅ 보호 범위를 전체 `/api/`로 확장 (health/stripe webhook만 제외)

---

## 🟠 HIGH Findings (1주 내 패치 권장)

### H-01: Rate Limiting이 분석 API에만 적용

| 엔드포인트 | Auth | Rate Limit | 위험 |
|---|---|---|---|
| `/api/upload` | ❌ → ✅ 패치됨 | ❌ → ✅ 패치됨 | 스토리지 비용 폭탄 |
| `/api/saju` | ❌ (Public) | ❌ → ✅ 패치됨 | CPU 남용 (Edge Runtime) |
| `/api/invite` | ✅ | ❌ | 토큰 열거 공격 |
| `/api/og` | ❌ (Public) | ❌ | 이미지 생성 DoS |

### H-02: Base64 이미지 페이로드 크기 무제한

**파일**: `src/app/api/analyze/dual-modal/route.ts`

`image` 필드가 base64 data URI를 허용하는데 크기 제한이 없다. 100MB base64 문자열을 보내면 서버 메모리가 폭발한다.

**패치**: ✅ 10MB 제한 적용

### H-03: `user_usage.user_id` 타입 불일치

DB에서 `user_id uuid references auth.users` (UUID FK)인데 코드의 `resolveUserId()`는 익명 유저에 대해 `"anon:1.2.3.4"` 문자열을 반환한다. FK 위반으로 INSERT 실패 → 익명 유저 Rate Limiting이 사실상 무력화.

**패치**: ✅ user_id를 TEXT로 변경하는 마이그레이션 제공

### H-04: Stripe Webhook 핸들러 미구현

`checkout.session.completed`와 `customer.subscription.deleted` 이벤트 핸들러가 TODO 상태. 결제해도 프리미엄 활성화 안되고, 구독 취소해도 프리미엄 유지.

### H-05: `isPremium` 파라미터가 서버에서 검증되지 않음

`checkRateLimit(identifier, feature, isPremium)` — 현재 모든 라우트에서 `false`로 하드코딩되어 당장은 안전하나, 향후 프론트엔드에서 이 값을 전달하면 무료 유저가 Rate Limit 우회 가능.

---

## 🟡 MEDIUM Findings

### M-01: Bot Detection이 User-Agent 기반으로 우회 용이

단순 문자열 매칭 기반이므로 커스텀 UA 설정으로 즉시 우회 가능. Vercel Bot Protection 또는 Cloudflare Turnstile 도입 권장.

### M-02: Origin 검증에 `includes()` 사용

`origin.includes(host)`는 서브도메인 우회에 취약하다. `host`가 `ohang.app`이면 `evil-ohang.app`도 통과. `URL` 파싱 후 `===` 비교 필요.

### M-03: 에러 메시지에 내부 정보 노출

`"CRITICAL: ANTHROPIC_API_KEY is missing in .env.local"` 같은 메시지가 사용자에게 그대로 전달됨. 내부 로그에만 남기고 사용자에게는 제네릭 메시지 반환 필요.

### M-04: OG Image 파라미터 길이 제한 없음

`archetype`, `name`, `partner` searchParams에 길이 제한 없어 과도한 문자열로 이미지 생성 과부하 가능.

### M-05: `ai_cache` 만료 데이터 자동 정리 없음

만료 체크가 읽기 시에만 수행되어 만료 캐시가 누적. `pg_cron`으로 주기적 정리 스케줄러 필요.

---

## ✅ POSITIVE Findings (잘 한 점)

### P-01: Security Headers 우수 (8/10)
- `Content-Security-Policy` 포괄적 설정
- `Strict-Transport-Security` preload 포함
- `X-Frame-Options: DENY`
- `Permissions-Policy`로 카메라/마이크 차단

### P-02: Rate Limiter Fail-Close 정책
DB 오류 시 요청을 차단(허용하지 않음) — 비용 폭탄 방어 핵심 설계.

### P-03: Zod Input Validation 일관 적용
모든 분석 API에 Zod 스키마. 타입 안전성 확보.

### P-04: Image URL 도메인 화이트리스트
Vercel Blob 도메인만 허용하여 SSRF 차단.

### P-05: API Keys 서버 사이드 격리
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`가 `NEXT_PUBLIC_` 접두사 없이 서버에만 존재.

### P-06: DB Connection Pooling 설정 우수
PgBouncer Transaction Mode + `connection_limit=1` — 서버리스 환경 최적.

### P-07: Supabase Admin Lazy Initialization
싱글톤 패턴으로 빌드 타임 크래시 방지.

---

## Architecture Review

### DB Connection Pooling

- ✅ PgBouncer Transaction Mode (Port 6543) — 서버리스 최적
- ✅ connection_limit=1 — Vercel Function 당 1 커넥션
- ✅ Direct URL (Port 5432) — 마이그레이션 전용 분리
- ⚠️ Supabase 대시보드에서 Transaction Mode 활성화 여부 확인 필요

**판정**: 서버리스에 안정적인 설정.

### 컴포넌트 리렌더링 분석

`ThemeContext`, `ToneProvider`가 별도 Context로 분리. `MoodThemeProvider`가 최상위에서 감싸지만 테마 변경 빈도가 낮아 수용 가능. 심각한 스파게티 코드나 리렌더링 지옥은 발견되지 않았다.

### AI Engine Failover Chain

Face Reading: GPT-4o → GPT-4o-mini → Claude → Text-only Fallback

모든 Vision API 실패 시 텍스트 추정 반환. `confidence: "low"` 로 대응하나 UI에서 강조 필요.

---

## 패치 적용 내역

| # | 파일 | 패치 내용 | 대응 |
|---|---|---|---|
| 1 | `src/app/api/upload/route.ts` | Auth, 5MB 제한, 이미지 타입, Rate Limit | C-01 |
| 2 | `src/middleware.ts` | 전체 /api/ 보호 확장 | C-03 |
| 3 | `src/app/api/analyze/dual-modal/route.ts` | Base64 10MB 제한 | H-02 |
| 4 | `src/app/api/saju/route.ts` | IP 기반 Rate Limit | H-01 |
| 5 | `supabase/migrations/20260223_security_hardening.sql` | RLS + user_id TEXT | C-02, H-03 |

---

## 미해결 항목 (수동 조치 필요)

1. **Stripe Webhook 핸들러 구현** — 결제 플로우 완성 (H-04)
2. **`isPremium` DB 기반 검증** — Supabase 구독 상태 조회 (H-05)
3. **Origin 검증 강화** — `includes()` → exact host match (M-02)
4. **Bot Detection 강화** — Turnstile/Vercel Bot Protection (M-01)
5. **Invite Token 저장** — Supabase에 토큰 persist (현재 저장 안됨)
6. **ai_cache 자동 정리** — pg_cron 설정 (M-05)
7. **에러 메시지 정제** — API 키 이름 노출 제거 (M-03)

---

*본 감사는 코드베이스 정적 분석 기반이며, 런타임 펜테스트는 미포함.*
*프로덕션 배포 전 패치 적용 후 재감사 권장.*
