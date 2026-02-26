# 🚀 OHANG Sprint 2 — Claude Code 즉시 실행 명령문
## Actionable Bash Commands (오차 없는 실행 가이드)
**작성일:** 2026-02-19
**전제조건:** Sprint 1 완료, 프로젝트 루트에서 실행

---

## ⚡ PHASE 0: 긴급 버그 수정 (5분)

### CMD-01: gender 하드코딩 수정

```bash
# 1줄 수정: gender: 'male' → gender: json.gender (또는 parsed gender)
cd ~/OHANG

# 현재 Line 44에서 gender가 destructure 안 됨 → 추가
# AS-IS: const { year, month, day, hour, minute, tone, imageUrl } = RequestSchema.parse(json);
# TO-BE: const { year, month, day, hour, minute, gender, tone, imageUrl } = RequestSchema.parse(json);

# AS-IS: gender: 'male',
# TO-BE: gender,

sed -i "s/const { year, month, day, hour, minute, tone, imageUrl } = RequestSchema.parse(json);/const { year, month, day, hour, minute, gender, tone, imageUrl } = RequestSchema.parse(json);/" src/app/api/analyze/archetype/route.ts

sed -i "s/gender: 'male',/gender,/" src/app/api/analyze/archetype/route.ts

echo "✅ BUG-01 Fixed: gender parameter now correctly passed from request"
```

### CMD-02: AI 모델 버전 업그레이드

```bash
# Claude 3.5 Sonnet 20240620 → Claude Sonnet 4.5 (latest)
sed -i "s/const TEXT_MODEL_ID = 'claude-3-5-sonnet-20240620';/const TEXT_MODEL_ID = 'claude-sonnet-4-5-20250929';/" src/lib/ai/engine.ts

echo "✅ BUG-02 Fixed: AI model upgraded to Claude Sonnet 4.5"
```

### CMD-03: 빌드 검증

```bash
cd ~/OHANG && npx next build 2>&1 | tail -20
# 기대 결과: ✅ Build completed successfully
```

---

## 🏗️ PHASE 1: 핵심 기능 구현 (Day 1-2)

### CMD-04: Compatibility Engine 메서드 추가

```bash
# engine.ts에 Compatibility 분석 메서드 추가
# 이 명령은 Claude Code에서 직접 파일 편집으로 실행

cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"src/lib/ai/engine.ts에 다음 메서드를 OhangEngine 클래스에 추가해줘:

1. static async streamCompatibilityAnalysis(
     contextA: OHANGContext,
     contextB: OHANGContext,
     options: EngineOptions
   )
   - CompatibilitySchema 사용
   - src/lib/ai/prompts/compatibility.ts에서 COMPATIBILITY_SYSTEM_PROMPT import
   - 두 사용자의 context를 JSON으로 결합하여 전달
   - Claude Sonnet 4.5 모델 사용

2. 대응하는 API Route: src/app/api/analyze/compatibility/route.ts
   - 두 사용자의 birth data를 받아 각각 SajuEngine.compute() 실행
   - OhangEngine.streamCompatibilityAnalysis() 호출
   - 캐시 + 레이트리밋 적용"
INSTRUCTION
```

### CMD-05: Compatibility 프롬프트 생성

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"src/lib/ai/prompts/compatibility.ts 파일을 새로 생성해줘.

내용:
- core.ts에서 FIVE_ELEMENTS_MAP, YONGSIN_LOGIC 임포트
- archetype.ts에서 ARCHETYPE_DEFINITIONS 임포트
- COMPATIBILITY_SYSTEM_PROMPT 상수 생성:
  - 55 Pair Chemistry Label 시스템 설명
  - dimension_scores 5개 차원 (passion/stability/communication/growth/timing) 평가 기준
  - void_complementarity 분석 로직 (완벽 보완/일방적/공유 공허/에너지 흡수/중립)
  - narrative 4장 구조 (만남/3개월차/갈림길/최종 판결)
  - ANTI-GENERIC 규칙 (archetype.ts와 동일 기준)
  - 출력: CompatibilitySchema에 맞는 JSON"
INSTRUCTION
```

### CMD-06: Share-to-Unlock 컴포넌트

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"src/components/viral/ShareToUnlock.tsx 컴포넌트를 생성해줘.

기능:
1. '친구 1명에게 공유하면 숨겨진 매력 카드 잠금 해제' UI
2. Web Share API 호출 (navigator.share)
3. 공유 완료 감지 후 localStorage에 unlock 상태 저장
4. Framer Motion으로 잠금해제 애니메이션 (0.6s spring)
5. MoodThemeProvider의 palette 색상 적용
6. Fallback: Web Share API 미지원 시 복사 링크 버튼

Props:
- contentId: string (잠금해제 대상 ID)
- shareUrl: string
- shareTitle: string
- children: ReactNode (잠긴 상태에서 보여줄 블러 컨텐츠)
- onUnlock: () => void"
INSTRUCTION
```

### CMD-07: Partner Link 시스템

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"궁합 초대 링크 시스템을 구현해줘. 3개 파일이 필요해:

1. src/app/api/partner-link/route.ts
   - POST: 초대 링크 생성 (UUID + 발신자 birth data 암호화)
   - GET: 초대 링크 조회 (상태: pending/completed)
   - Supabase 'partner_links' 테이블 사용
   - 만료: 72시간

2. src/app/chemistry/[linkId]/page.tsx
   - 초대받은 사용자가 접속하는 페이지
   - 자신의 생년월일 입력 폼
   - 제출 시 양쪽 모두에게 Chemistry Score 생성
   - 결과: /chemistry/result/[linkId]로 리다이렉트

3. src/components/viral/PartnerLinkCard.tsx
   - 링크 공유 카드 UI (복사 + SNS 공유)
   - 상대방 입력 대기 중 애니메이션
   - 완료 시 결과 알림

Supabase 테이블 스키마:
CREATE TABLE partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  creator_birth_data JSONB NOT NULL,
  recipient_birth_data JSONB,
  chemistry_result JSONB,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);"
INSTRUCTION
```

---

## 💳 PHASE 2: 수익화 (Day 3)

### CMD-08: Stripe 결제 모듈

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"Stripe 결제를 통합해줘. 환경변수 STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 사용.

1. src/app/api/stripe/checkout/route.ts
   - POST: Stripe Checkout Session 생성
   - 3개 Price ID (Basic/Pro/Destiny)
   - success_url: /payment/success?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: /pricing

2. src/app/api/stripe/webhook/route.ts
   - Stripe Webhook 수신 (checkout.session.completed)
   - Supabase user_subscriptions 테이블 업데이트
   - signature 검증 필수

3. src/app/payment/success/page.tsx
   - 결제 성공 페이지 (Confetti 애니메이션)
   - canvas-confetti 라이브러리 사용 (이미 설치됨)

4. src/lib/stripe/config.ts
   - Price 구성: Basic ₩3,900 (1회), Pro ₩9,900/월, Destiny ₩49,900 (평생)
   - 타입 정의"
INSTRUCTION
```

### CMD-09: Payment Recovery 이메일

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"Stripe 결제 실패 복구 시스템을 만들어줘.

1. src/app/api/stripe/webhook/route.ts에 추가 이벤트:
   - invoice.payment_failed → Supabase 'payment_failures' 테이블에 기록
   - 1시간 후 할인 쿠폰 Stripe Promotion Code 자동 생성 (10% OFF)

2. src/lib/email/recovery.ts
   - Supabase Edge Function으로 복구 이메일 발송
   - 템플릿: '결제에 문제가 있었어요. 특별 할인으로 다시 시도하세요.'
   - 개인화: 사용자 아키타입 이름 포함

참고: 이메일 발송은 Supabase의 auth.email 또는 Resend 사용"
INSTRUCTION
```

---

## 🔥 PHASE 3: 바이럴 & SEO (Day 4)

### CMD-10: Web Share API

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"src/components/ui/ShareButton.tsx를 만들어줘.

기능:
- navigator.share() 호출 (Web Share API)
- Fallback: 클립보드 복사 + toast 알림
- 공유 데이터: title, text, url
- MoodTheme 색상 적용
- 아이콘: lucide-react Share2
- 공유 카운트 추적 (Supabase user_shares 테이블)
- Framer Motion whileTap 애니메이션"
INSTRUCTION
```

### CMD-11: Programmatic SEO 55페이지

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"10개 아키타입의 모든 궁합 조합 55개에 대한 SEO 랜딩 페이지를 생성해줘.

1. src/app/chemistry/[pairSlug]/page.tsx
   - Dynamic Route: /chemistry/maverick-vs-healer
   - generateStaticParams()로 55개 경로 빌드 타임 생성
   - 각 페이지: 해당 조합의 간략 궁합 설명 + CTA('내 궁합 확인하기')
   - Dynamic OG Image: /api/og?mode=chemistry&archetypeA=...&archetypeB=...

2. src/lib/constants/pairings.ts
   - 10C2 = 45 크로스 조합 + 10 셀프 조합 = 55개
   - 각 조합: slug, label, brief description

3. 각 페이지 메타데이터:
   - title: '{ArchetypeA} × {ArchetypeB} Chemistry | OHANG'
   - description: 동적 생성
   - JSON-LD: SoftwareApplication schema

빌드 후 55개 정적 페이지가 생성되어야 함."
INSTRUCTION
```

### CMD-12: Streak Reward 시스템

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"Daily Streak 보상 시스템을 구현해줘.

1. src/lib/streak/tracker.ts
   - Supabase user_streaks 테이블 CRUD
   - checkStreak(): 오늘 방문 기록 + 연속일 계산
   - getReward(): 3일=월간총운 무료, 7일=궁합 1회 무료, 30일=Pro 1개월

2. src/components/streak/StreakBanner.tsx
   - 현재 연속일 + 다음 보상까지 남은 일수
   - 불꽃 이모지 + Framer Motion 카운터 애니메이션
   - MoodTheme 색상 적용

3. Supabase 테이블:
CREATE TABLE user_streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_visit DATE,
  rewards_claimed JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);"
INSTRUCTION
```

---

## 🧪 PHASE 4: QA & 최적화 (Day 5)

### CMD-13: Bundle 분석

```bash
cd ~/OHANG

# Bundle analyzer 설치 및 실행
npm install --save-dev @next/bundle-analyzer

# next.config.ts에 analyzer 래핑 추가
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"next.config.ts를 수정해서 ANALYZE=true 환경변수일 때 bundle analyzer를 활성화해줘.
@next/bundle-analyzer 패키지 사용."
INSTRUCTION

# 분석 실행
ANALYZE=true npx next build
```

### CMD-14: Lighthouse 최적화

```bash
cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"Lighthouse 100점을 목표로 다음을 최적화해줘:

1. next.config.ts:
   - reactCompiler 활성화 (실험적)
   - Code splitting: manseryeok, astronomy-engine은 /analyze에서만 로드

2. src/app/layout.tsx:
   - Critical CSS inline
   - 폰트 preload 최적화 (실제 사용 폰트만)

3. public/manifest.json 생성 (PWA 준비)

4. 이미지: 모든 public/ 이미지를 WebP로 변환"
INSTRUCTION
```

### CMD-15: E2E 기본 테스트

```bash
# Playwright 설치
cd ~/OHANG
npm install --save-dev @playwright/test
npx playwright install chromium

cat << 'INSTRUCTION'
📝 Claude Code에게 전달할 프롬프트:

"Playwright E2E 테스트를 작성해줘. tests/ 디렉토리에 생성.

1. tests/archetype-flow.spec.ts
   - 메인 페이지 접속
   - 생년월일 입력 (1990-05-15, male)
   - 분석 시작 버튼 클릭
   - CelestialLoading 표시 확인
   - 결과 페이지에 archetype 이름 표시 확인
   - 공유 버튼 존재 확인

2. tests/paywall.spec.ts
   - 무료 결과 페이지 접속
   - PaywallGate 블러 표시 확인
   - '업그레이드' 버튼 클릭 시 모달 표시 확인

3. playwright.config.ts 생성"
INSTRUCTION
```

---

## 🚀 PHASE 5: 배포

### CMD-16: Vercel 환경변수 확인

```bash
# Vercel CLI로 환경변수 확인
npx vercel env ls

# 필수 환경변수 목록:
echo "=== Required Environment Variables ==="
echo "NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY"
echo "ANTHROPIC_API_KEY"
echo "OPENAI_API_KEY"
echo "STRIPE_SECRET_KEY"
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "STRIPE_WEBHOOK_SECRET"
echo "NEXT_PUBLIC_SITE_URL"
```

### CMD-17: Production 빌드 & 배포

```bash
cd ~/OHANG

# 1. 최종 빌드 검증
npx next build 2>&1 | tail -20

# 2. 타입 체크
npx tsc --noEmit

# 3. 린트
npx eslint src/ --max-warnings 0

# 4. 배포
npx vercel --prod

echo "🎉 OHANG v3.2 Production Deployed!"
```

---

## 📋 실행 체크리스트

```
Phase 0: 긴급 (5분)
[ ] gender 하드코딩 수정
[ ] AI 모델 업그레이드
[ ] 빌드 검증

Phase 1: 핵심 기능 (Day 1-2)
[ ] Compatibility 프롬프트 생성
[ ] Compatibility Engine + API Route
[ ] Share-to-Unlock 컴포넌트
[ ] Partner Link 시스템 (API + 페이지 + 카드)

Phase 2: 수익화 (Day 3)
[ ] Stripe Checkout 통합
[ ] Stripe Webhook 처리
[ ] 결제 성공 페이지
[ ] Payment Recovery 이메일

Phase 3: 바이럴 & SEO (Day 4)
[ ] ShareButton 컴포넌트
[ ] Programmatic SEO 55페이지
[ ] Streak Reward 시스템

Phase 4: QA (Day 5)
[ ] Bundle 분석
[ ] Lighthouse 최적화
[ ] E2E 테스트 작성

Phase 5: 배포
[ ] 환경변수 확인
[ ] Production 빌드
[ ] Vercel 배포
```

---

*Generated: 2026-02-19 | Sprint 2 Execution Guide v1.0*
