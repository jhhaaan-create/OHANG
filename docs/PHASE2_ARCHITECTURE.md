# 🏗️ OHANG Phase 2 — Zero-Defect Architecture v2.0

**작성일:** 2026-02-19
**기준:** Sprint 1 완료 + 기술 감사 통과 (74/100)
**목표:** 6대 핵심 기능 + 아젠다 30선 통합 구현 → 달성률 70%+ → Production 런칭

---

## Table of Contents

1. [Feature 1: Compatibility (궁합 분석 + Share-to-Unlock)](#feature-1-compatibility)
2. [Feature 2: Face Reading (관상 분석 + Vision API Failover)](#feature-2-face-reading)
3. [Feature 3: Red Flag Radar (위험 분석 + 손실 회피)](#feature-3-red-flag-radar)
4. [Feature 4: Daily Vibe (일일 운세 + Streak Reward)](#feature-4-daily-vibe)
5. [Feature 5: Chemistry Card Sharing (동적 OG 이미지)](#feature-5-chemistry-card-sharing)
6. [Feature 6: Tone Switching UI (3-Tone 즉시 전환)](#feature-6-tone-switching-ui)
7. [Zod Schema Mapping Matrix](#zod-schema-mapping-matrix)
8. [Execution Command](#execution-command)

---

## Architecture Principles

```
┌─────────────────────────────────────────────────────────┐
│                    Atomic Design Layers                   │
├─────────────────────────────────────────────────────────┤
│ Atoms     → Button, Badge, ProgressBar, ScoreRing       │
│ Molecules → DimensionBar, FlagCard, VibeCard, TonePill  │
│ Organisms → CompatibilityResult, RedFlagPanel, VibeDaily│
│ Templates → AnalysisLayout, DashboardLayout              │
│ Pages     → /chemistry, /face-reading, /red-flag, /vibe │
└─────────────────────────────────────────────────────────┘
```

**Server Action Pattern (Next.js 16):**
```
Client Component (UI)
  → Server Action (validation + auth)
    → OhangEngine method (AI call)
      → Zod schema validation (output)
        → Supabase cache (persistence)
          → Streaming response (client)
```

---

## Feature 1: Compatibility

### 궁합 분석 + Share-to-Unlock 바이럴 루프

### 1.1 Component Tree

```
src/
├── app/(main)/chemistry/
│   ├── page.tsx                          ← Server Component (SEO + metadata)
│   ├── CompatibilityClient.tsx           ← "use client" — 메인 인터랙션
│   ├── [pair]/
│   │   └── page.tsx                      ← Programmatic SEO (55 페어)
│   └── actions.ts                        ← Server Action (analyzeCompatibility)
│
├── app/api/analyze/compatibility/
│   └── route.ts                          ← Streaming API Route
│
├── components/chemistry/
│   ├── atoms/
│   │   ├── ScoreRing.tsx                 ← 원형 점수 표시 (SVG + Framer Motion)
│   │   ├── DimensionBar.tsx              ← 5개 차원 바 차트
│   │   └── ElementBadge.tsx              ← 오행 원소 배지
│   ├── molecules/
│   │   ├── ChemistryHeader.tsx           ← Archetype A × B 제목
│   │   ├── VoidComplementCard.tsx         ← 공허 상보성 카드
│   │   ├── NarrativeTimeline.tsx          ← Meeting → Month 3 → Crossroads → Verdict
│   │   └── SurvivalTipBanner.tsx          ← 생존 팁 (actionable)
│   ├── organisms/
│   │   ├── CompatibilityResult.tsx        ← 전체 결과 조립
│   │   ├── PartnerInputForm.tsx           ← 상대방 생년월일 입력 폼
│   │   └── ShareToUnlockGate.tsx          ← 🔑 공유 후 잠금해제 (바이럴 엔진)
│   └── templates/
│       └── ChemistryLayout.tsx            ← 레이아웃 래퍼
│
└── lib/ai/
    ├── engine.ts                          ← OhangEngine.streamCompatibility() 추가
    └── schemas.ts                         ← CompatibilitySchema (기존 ✅)
```

### 1.2 Data Flow

```
┌───────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ PartnerInput  │────▶│ Server Action    │────▶│ OhangEngine        │
│ Form          │     │ actions.ts       │     │ .streamCompat()    │
│               │     │                  │     │                    │
│ person_a_id   │     │ 1. Auth check    │     │ 1. Build prompt    │
│ person_b_birth│     │ 2. Zod validate  │     │ 2. Claude API call │
│ tone          │     │ 3. Rate limit    │     │ 3. Stream response │
└───────────────┘     │ 4. Cache lookup  │     │ 4. Zod validate    │
                      └──────────────────┘     │ 5. Cache result    │
                                               └────────────────────┘
                                                        │
                    ┌───────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ CompatibilityResult (Streaming UI)                       │
│                                                          │
│ ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐ │
│ │ ScoreRing   │ │ DimensionBar │ │ VoidComplement    │ │
│ │ (overall:87)│ │ ×5 bars      │ │ Card              │ │
│ └─────────────┘ └──────────────┘ └───────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ NarrativeTimeline (4-act story)                     │ │
│ │ The Meeting → Month 3 → Crossroads → Verdict        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────┐  ┌─────────────────────────────┐  │
│ │ SurvivalTipBanner│  │ ShareToUnlockGate           │  │
│ │                  │  │ (공유하면 추가 인사이트)      │  │
│ └──────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Share-to-Unlock 바이럴 루프 설계

```
┌──────────────────────────────────────────────────────┐
│ SHARE-TO-UNLOCK FLOW                                  │
│                                                        │
│ [결과의 70% 표시]                                      │
│      ↓                                                 │
│ "void_complementarity를 보려면 공유하세요"              │
│      ↓                                                 │
│ ┌────────────────────────────┐                        │
│ │ ShareToUnlockGate          │                        │
│ │                            │                        │
│ │ 1. Web Share API 호출      │                        │
│ │ 2. 공유 완료 감지          │                        │
│ │    - navigator.share()     │                        │
│ │    - 콜백 성공 시 unlock   │                        │
│ │ 3. Supabase 기록           │                        │
│ │    - user_id               │                        │
│ │    - share_platform        │                        │
│ │    - shared_at             │                        │
│ │ 4. localStorage fallback   │                        │
│ │    - ohang_shared_{key}    │                        │
│ └────────────────────────────┘                        │
│      ↓                                                 │
│ [AnimatePresence로 나머지 30% reveal]                  │
│ - void_complementarity.insight                         │
│ - narrative.the_crossroads                             │
│ - survival_tip (구체적)                                │
└──────────────────────────────────────────────────────┘
```

### 1.4 Zod Schema 매핑

```typescript
// CompatibilitySchema ← schemas.ts Line 93-129 (기존 완비 ✅)
//
// Server Action Input Schema (NEW):
const CompatibilityInputSchema = z.object({
  personA: z.object({
    userId: z.string().uuid(),
    archetype: z.string(),
    element_dominant: z.enum(["Wood","Fire","Earth","Metal","Water"]),
    element_void: z.enum(["Wood","Fire","Earth","Metal","Water"]),
    element_balance: z.object({
      wood: z.number(), fire: z.number(), earth: z.number(),
      metal: z.number(), water: z.number(),
    }),
    day_master_strength: z.enum(["strong","weak"]),
  }),
  personB: z.object({
    name: z.string().min(1).max(50),
    birthYear: z.number().int().min(1940).max(2010),
    birthMonth: z.number().int().min(1).max(12),
    birthDay: z.number().int().min(1).max(31),
    birthHour: z.number().int().min(-1).max(23), // -1 = unknown
    gender: z.enum(["male","female"]),
    isLunar: z.boolean().default(false),
  }),
  tone: z.enum(["savage","balanced","gentle"]).default("balanced"),
});
// Output: CompatibilitySchema (z.infer → Compatibility type)
```

### 1.5 Engine Method 설계

```typescript
// engine.ts에 추가할 메서드
static async streamCompatibility(
  contextA: OHANGContext,
  contextB: OHANGContext,
  options: EngineOptions
) {
  const systemPrompt = COMPATIBILITY_SYSTEM_PROMPT; // prompts/compatibility.ts
  const input = {
    person_a: { archetype, element_dominant, element_void, element_balance, day_master_strength },
    person_b: { /* same structure */ },
    tone: options.tone,
  };
  return streamObject({
    model: anthropic(TEXT_MODEL_ID),
    schema: CompatibilitySchema,
    system: systemPrompt,
    prompt: JSON.stringify(input),
    temperature: 0.75, // 약간 높게 → 내러티브 창의성
    maxOutputTokens: 5000,
    onFinish: async (event) => { /* cache + log */ },
  });
}
```

### 1.6 Programmatic SEO (55페이지)

```typescript
// src/app/(main)/chemistry/[pair]/page.tsx
export async function generateStaticParams() {
  const archetypes = [
    "maverick","icon","muse","healer","peer",
    "wildcard","voyager","architect","royal","enigma"
  ];
  const pairs: { pair: string }[] = [];
  for (let i = 0; i < archetypes.length; i++) {
    for (let j = i; j < archetypes.length; j++) {
      pairs.push({ pair: `${archetypes[i]}-vs-${archetypes[j]}` });
    }
  }
  return pairs; // 55 pairs (10C2 + 10 self-pairs)
}

export async function generateMetadata({ params }) {
  const [a, b] = params.pair.split("-vs-");
  return {
    title: `${a} × ${b} Chemistry | OHANG`,
    description: `Discover the elemental chemistry between ${a} and ${b}...`,
    openGraph: {
      images: [`/api/og?mode=chemistry&archetype=${a}&partner=${b}`],
    },
  };
}
```

---

## Feature 2: Face Reading

### 관상 분석 + Vision API Failover 방어 로직

### 2.1 Component Tree

```
src/
├── app/(main)/face-reading/
│   ├── page.tsx                          ← Server Component
│   ├── FaceReadingClient.tsx             ← "use client"
│   └── actions.ts                        ← Server Action
│
├── app/api/analyze/face-reading/
│   └── route.ts                          ← Vision API Route
│
├── components/face-reading/
│   ├── atoms/
│   │   ├── ZoneIndicator.tsx             ← 삼정(上中下) 인디케이터
│   │   ├── OfficerBadge.tsx              ← 오관(눈/코/입/귀/이마) 배지
│   │   └── ConfidenceTag.tsx             ← high/medium/low 신뢰도
│   ├── molecules/
│   │   ├── FaceUploader.tsx              ← 이미지 업로드 + 프리뷰
│   │   ├── ZoneAnalysisCard.tsx          ← 상정/중정/하정 카드
│   │   ├── PalaceInsightRow.tsx          ← 부처궁/전택궁/복덕궁
│   │   └── CrossAnalysisBanner.tsx       ← 사주 교차 분석 배너
│   ├── organisms/
│   │   ├── FaceReadingResult.tsx          ← 전체 결과 조립
│   │   └── FaceImageCapture.tsx           ← 카메라/갤러리 선택
│   └── templates/
│       └── FaceReadingLayout.tsx
│
└── lib/ai/
    └── engine.ts                          ← OhangEngine.streamFaceReading() 추가
```

### 2.2 Data Flow + Vision API Failover

```
┌─────────────────┐
│ FaceImageCapture │
│                  │
│ 1. Camera/Upload │
│ 2. Client resize │
│    (max 1024px)  │
│ 3. Vercel Blob   │
│    upload         │
└────────┬─────────┘
         ▼
┌──────────────────────────────────────────────────────┐
│ Server Action: analyzeFaceReading                     │
│                                                        │
│ 1. Auth check (Supabase session)                      │
│ 2. Image URL 화이트리스트 검증 (Vercel Blob only)     │
│ 3. Rate limit check (cache.ts)                        │
│ 4. Saju context 조회 (기존 archetype 결과)             │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ VISION API FAILOVER CHAIN                        │  │
│ │                                                    │  │
│ │ Primary: GPT-4o (OPENAI_API_KEY)                 │  │
│ │    ↓ [timeout 30s OR error 4xx/5xx]               │  │
│ │ Fallback 1: GPT-4o-mini (저비용 대안)             │  │
│ │    ↓ [timeout 20s OR error]                       │  │
│ │ Fallback 2: Claude Vision (claude-sonnet-4-5)     │  │
│ │    ↓ [timeout 30s OR error]                       │  │
│ │ Fallback 3: TEXT-ONLY 모드 (이미지 없이 사주만)   │  │
│ │    → "관상 분석 일시 불가" 안내 + 사주 기반 추론  │  │
│ │                                                    │  │
│ │ 각 단계 로그: logUsage(userId, 'face_reading',    │  │
│ │   { model, latency, fallback_level })             │  │
│ └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ FaceReadingResult (Streaming)                        │
│                                                       │
│ ┌──────────┐ ┌──────────────┐ ┌─────────────────┐  │
│ │ 삼정 Zone│ │ 오관 Officer │ │ 십이궁 Palace  │  │
│ │ Analysis │ │ Cards (3-5)  │ │ Insights (3)   │  │
│ └──────────┘ └──────────────┘ └─────────────────┘  │
│                                                       │
│ ┌─────────────────────────────────────────────────┐  │
│ │ CrossAnalysisBanner                             │  │
│ │ "얼굴은 Fire인데 사주는 Water → 내면/외면 갭"  │  │
│ │ (사주 데이터 존재 시에만 표시)                   │  │
│ └─────────────────────────────────────────────────┘  │
│                                                       │
│ ┌──────────────────────────┐                         │
│ │ ShareButton (share_line) │                         │
│ └──────────────────────────┘                         │
└─────────────────────────────────────────────────────┘
```

### 2.3 Failover Implementation

```typescript
// engine.ts — Vision API Failover Chain
static async streamFaceReading(
  imageUrl: string,
  sajuContext: OHANGContext | null,
  options: EngineOptions
) {
  const FAILOVER_CHAIN = [
    { model: openai('gpt-4o'),          timeout: 30000, label: 'gpt-4o' },
    { model: openai('gpt-4o-mini'),     timeout: 20000, label: 'gpt-4o-mini' },
    { model: anthropic('claude-sonnet-4-5-20250929'), timeout: 30000, label: 'claude-vision' },
  ];

  for (const [index, config] of FAILOVER_CHAIN.entries()) {
    try {
      const result = await Promise.race([
        streamObject({
          model: config.model,
          schema: FaceReadingSchema,
          system: FACE_READING_SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: [
              { type: 'image', image: imageUrl },
              { type: 'text', text: sajuContext
                ? `Saju Cross-Reference Data:\n${JSON.stringify(sajuContext)}`
                : 'No Saju data available. Analyze face only.' },
            ]},
          ],
          temperature: 0.5,
          onFinish: async (event) => {
            await Promise.all([
              setCachedResult(options.cacheKey, event.object, CACHE_TTL_HOURS),
              logUsage(options.userId, 'face_reading', {
                model: config.label, fallback_level: index
              }),
            ]);
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), config.timeout)
        ),
      ]);
      return result; // 성공 시 즉시 반환
    } catch (error) {
      console.error(`[FaceReading] ${config.label} failed:`, error);
      if (index === FAILOVER_CHAIN.length - 1) {
        // 모든 Vision 실패 → TEXT-ONLY 폴백
        return this.streamTextOnlyFaceEstimation(sajuContext, options);
      }
      continue; // 다음 모델 시도
    }
  }
}
```

### 2.4 Zod Schema 매핑

```typescript
// FaceReadingSchema ← schemas.ts Line 132-161 (기존 완비 ✅)
//
// Server Action Input Schema (NEW):
const FaceReadingInputSchema = z.object({
  imageUrl: z.string().url().refine(
    (url) => url.startsWith('https://') && url.includes('vercel-storage.com'),
    { message: 'Image must be hosted on Vercel Blob' }
  ),
  includesSajuData: z.boolean().default(false),
  sajuResultId: z.string().uuid().optional(), // 기존 archetype 결과 ID
  tone: z.enum(["savage","balanced","gentle"]).default("balanced"),
});
// Output: FaceReadingSchema (z.infer → FaceReading type)
```

---

## Feature 3: Red Flag Radar

### 위험 분석 + 극단적 손실 회피 텍스트

### 3.1 Component Tree

```
src/
├── app/(main)/red-flag/
│   ├── page.tsx                          ← Server Component
│   ├── RedFlagClient.tsx                 ← "use client"
│   └── actions.ts                        ← Server Action
│
├── app/api/analyze/red-flag/
│   └── route.ts                          ← Streaming API Route
│
├── components/red-flag/
│   ├── atoms/
│   │   ├── RiskLevelBadge.tsx            ← GREEN/YELLOW/RED/RUN 배지
│   │   ├── SeverityDot.tsx               ← low/medium/high 점
│   │   └── RiskScoreGauge.tsx            ← 0-100 게이지 (반원형)
│   ├── molecules/
│   │   ├── FlagCard.tsx                  ← 개별 레드플래그 카드
│   │   │   ├── flag title
│   │   │   ├── severity indicator
│   │   │   ├── element_cause badge
│   │   │   ├── how_it_shows (접을 수 있음)
│   │   │   └── mitigation (접을 수 있음)
│   │   ├── PatternRevealCard.tsx          ← "당신의 반복 패턴" (손실 회피)
│   │   └── HiddenStrengthCard.tsx         ← 균형잡힌 긍정 메시지
│   ├── organisms/
│   │   ├── RedFlagResult.tsx              ← 전체 결과 조립
│   │   └── PartnerQuickInput.tsx          ← 상대방 간편 입력
│   └── templates/
│       └── RedFlagLayout.tsx
│
└── lib/ai/
    └── engine.ts                          ← OhangEngine.streamRedFlag() 추가
```

### 3.2 Data Flow

```
┌───────────────────┐     ┌─────────────────────────┐
│ PartnerQuickInput │────▶│ Server Action            │
│                   │     │                          │
│ "이 사람 안전해?" │     │ 1. Auth + Rate limit     │
│ 상대방 정보 입력  │     │ 2. Zod Input validate    │
│                   │     │ 3. SajuEngine.compute()  │
│                   │     │    for both persons       │
│                   │     │ 4. OhangEngine            │
│                   │     │    .streamRedFlag()       │
└───────────────────┘     └─────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────┐
│ RedFlagResult (Streaming + Progressive Disclosure)   │
│                                                       │
│ Phase 1: [즉시 표시]                                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ RiskLevelBadge: "RED" + RiskScoreGauge: 67/100  │ │
│ │ headline: "이 사람, 당신의 Metal을 녹이고 있어"  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                       │
│ Phase 2: [ScrollReveal — 0.6s 딜레이]                │
│ ┌──────────────────────────────────────────────────┐ │
│ │ FlagCard ×3-5 (severity 순 정렬)                 │ │
│ │ "Silent Treatment Pattern"                       │ │
│ │ "Commitment Dance"                               │ │
│ │ "Energy Vampire Dynamic"                         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                       │
│ Phase 3: [손실 회피 텍스트 — PaywallGate 래핑]       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🔒 "the_pattern" — 당신의 반복되는 연애 패턴     │ │
│ │ 🔒 "if_you_proceed" — 그래도 진행한다면...       │ │
│ │                                                    │ │
│ │ ⚡ PaywallGate wrapping:                          │ │
│ │ cliffhangerText:                                   │ │
│ │   "당신이 이 유형에 끌리는 이유는 [████████]"     │ │
│ └──────────────────────────────────────────────────┘ │
│                                                       │
│ Phase 4: [항상 표시 — 균형]                           │
│ ┌──────────────────────────────────────────────────┐ │
│ │ HiddenStrengthCard: hidden_strength              │ │
│ │ "위험하지만 이 사람의 진짜 장점은..."             │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.3 손실 회피 텍스트 전략

```
┌───────────────────────────────────────────────────────┐
│ LOSS AVERSION TEXT ENGINE                               │
│                                                         │
│ Level 1 (GREEN — Score 0-25):                          │
│   "큰 위험 없어요. 다만 이것만 주의하세요: ..."        │
│   → 가벼운 어조, 구체적 팁 1개                          │
│                                                         │
│ Level 2 (YELLOW — Score 26-50):                        │
│   "지금은 괜찮아 보이지만, 3개월 후 이런 패턴이..."    │
│   → 미래 시제 사용 → "아직 늦지 않았다" 뉘앙스          │
│                                                         │
│ Level 3 (RED — Score 51-75):                           │
│   "솔직히 말할게요. 이 조합에서 [구체적 패턴]이         │
│    반복될 확률이 높아요. 이미 느끼고 있지 않나요?"       │
│   → 현재 시제 + 직접 질문 → 자기 확인 편향 활용         │
│                                                         │
│ Level 4 (RUN — Score 76-100):                          │
│   "당신이 이 글을 읽고 있다는 건,                       │
│    이미 뭔가 느꼈다는 뜻이에요.                         │
│    그 직감은 틀리지 않았어요."                           │
│   → 극단적 손실 회피 + 직감 확인                        │
│   → "지금 돌아서면 잃는 건 환상뿐이에요.                │
│      계속 가면 잃는 건 [████████]입니다."               │
│   → [████████] = PaywallGate 블러 처리                  │
└───────────────────────────────────────────────────────┘
```

### 3.4 Zod Schema 매핑

```typescript
// RedFlagSchema ← schemas.ts Line 187-205 (기존 완비 ✅)
//
// Server Action Input Schema (NEW):
const RedFlagInputSchema = z.object({
  userId: z.string().uuid(),
  partnerData: z.object({
    name: z.string().min(1).max(50),
    birthYear: z.number().int().min(1940).max(2010),
    birthMonth: z.number().int().min(1).max(12),
    birthDay: z.number().int().min(1).max(31),
    birthHour: z.number().int().min(-1).max(23),
    gender: z.enum(["male","female"]),
  }),
  myArchetypeResultId: z.string().uuid(), // 기존 본인 분석 결과 참조
  tone: z.enum(["savage","balanced","gentle"]).default("balanced"),
});
// Output: RedFlagSchema (z.infer → RedFlag type)
```

---

## Feature 4: Daily Vibe

### 일일 운세 + 3일 연속 방문 Streak Reward

### 4.1 Component Tree

```
src/
├── app/(main)/dashboard/
│   └── page.tsx                          ← DailyVibe 위젯 포함
│
├── app/api/vibe/
│   ├── today/
│   │   └── route.ts                      ← 오늘의 운세 API
│   └── streak/
│       └── route.ts                      ← 연속 방문 체크 API
│
├── components/vibe/
│   ├── atoms/
│   │   ├── VibeScoreBadge.tsx            ← 점수 + 키워드 + 이모지
│   │   ├── TimeWindowPill.tsx            ← 피크/회피 시간대 표시
│   │   ├── LuckyColorDot.tsx             ← 행운 색상 + 팁
│   │   └── StreakFlameBadge.tsx           ← 🔥 연속 방문 뱃지
│   ├── molecules/
│   │   ├── VibeCard.tsx                  ← 오늘의 바이브 카드 (free)
│   │   ├── DetailedVibeCard.tsx          ← 상세 운세 카드 (premium)
│   │   ├── TimeWindowBar.tsx             ← 24시간 타임라인 바
│   │   └── StreakProgressBar.tsx          ← 3일 연속 프로그레스
│   ├── organisms/
│   │   ├── DailyVibeWidget.tsx            ← 대시보드 위젯 (접이식)
│   │   └── StreakRewardModal.tsx           ← 보상 모달
│   └── templates/
│       └── VibeLayout.tsx
│
├── lib/vibe/
│   ├── calendar.ts                        ← 천간지지 일진 계산
│   ├── streak.ts                          ← Streak 로직
│   └── notifications.ts                   ← Push 알림 준비
│
└── lib/ai/
    └── engine.ts                          ← OhangEngine.streamDailyVibe() 추가
```

### 4.2 Data Flow

```
┌──────────────────────────────────────────────────────┐
│ DAILY VIBE FLOW                                       │
│                                                        │
│ [매일 오전 — 사용자 대시보드 접속]                     │
│                                                        │
│ ┌──────────────┐                                      │
│ │ GET /api/    │   1. 오늘 천간지지 계산               │
│ │ vibe/today   │      calendar.ts                      │
│ │              │      → { stem: "甲", branch: "子",    │
│ │              │         stem_element: "Wood",          │
│ │              │         branch_element: "Water" }      │
│ │              │                                        │
│ │              │   2. 캐시 확인                         │
│ │              │      key: `vibe:${userId}:${date}`     │
│ │              │      TTL: 24h (자정 만료)              │
│ │              │                                        │
│ │              │   3. 캐시 미스 → OhangEngine           │
│ │              │      .streamDailyVibe()                │
│ │              │                                        │
│ │              │   4. Streak 업데이트                   │
│ │              │      GET /api/vibe/streak              │
│ └──────┬───────┘                                      │
│        ▼                                               │
│ ┌──────────────────────────────────────────────────┐  │
│ │ DailyVibeWidget (Dashboard)                      │  │
│ │                                                    │  │
│ │ ┌────────────────────────────────────────────┐   │  │
│ │ │ Free Tier:                                  │   │  │
│ │ │ VibeScoreBadge (67 🌊 "Reflection")        │   │  │
│ │ │ message_brief (1문장)                       │   │  │
│ │ │ lucky_color dot                              │   │  │
│ │ └────────────────────────────────────────────┘   │  │
│ │                                                    │  │
│ │ ┌────────────────────────────────────────────┐   │  │
│ │ │ Premium Tier (PaywallGate):                │   │  │
│ │ │ DetailedVibeCard                           │   │  │
│ │ │ message_detailed (3-4문장)                 │   │  │
│ │ │ TimeWindowBar (peak + avoid 표시)          │   │  │
│ │ │ love_forecast                              │   │  │
│ │ │ one_thing_to_avoid                         │   │  │
│ │ └────────────────────────────────────────────┘   │  │
│ └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.3 Streak Reward 시스템

```
┌──────────────────────────────────────────────────────┐
│ STREAK REWARD SYSTEM (Duolingo-inspired)              │
│                                                        │
│ DB Schema (Supabase):                                 │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Table: user_streaks                               │ │
│ │ ├── id: uuid (PK)                                │ │
│ │ ├── user_id: uuid (FK → auth.users)              │ │
│ │ ├── current_streak: int (default 0)              │ │
│ │ ├── longest_streak: int (default 0)              │ │
│ │ ├── last_visit_date: date                        │ │
│ │ ├── total_visits: int (default 0)                │ │
│ │ ├── reward_tier: enum(none,bronze,silver,gold)   │ │
│ │ └── updated_at: timestamptz                      │ │
│ │                                                    │ │
│ │ RLS: user_id = auth.uid()                        │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ Streak Logic (streak.ts):                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ IF last_visit_date = yesterday → streak + 1      │ │
│ │ IF last_visit_date = today → no change (이미방문)│ │
│ │ IF last_visit_date < yesterday → streak = 1      │ │
│ │                                                    │ │
│ │ Reward Tiers:                                     │ │
│ │  3일 연속 → Bronze 🥉 → 무료 Premium 1일         │ │
│ │  7일 연속 → Silver 🥈 → 무료 궁합 분석 1회       │ │
│ │ 30일 연속 → Gold 🥇   → Basic 무료 해금           │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ UI: StreakRewardModal                                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ┌────┐ ┌────┐ ┌────┐                            │ │
│ │ │ 🔥 │ │ 🔥 │ │ ⬜ │  "2일 연속! 내일도 오면   │ │
│ │ │ D1 │ │ D2 │ │ D3 │   Premium 분석이 무료!"    │ │
│ │ └────┘ └────┘ └────┘                            │ │
│ │                                                    │ │
│ │ [StreakProgressBar: ██████░░░░ 2/3]              │ │
│ │                                                    │ │
│ │ confetti animation on tier unlock                 │ │
│ │ (canvas-confetti — already in package.json)       │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 4.4 천간지지 일진 계산

```typescript
// lib/vibe/calendar.ts
// manseryeok 패키지 활용 (package.json에 이미 설치됨 ✅)
import { /* manseryeok API */ } from 'manseryeok';

interface TodayPillar {
  heavenly_stem: string;    // 천간 (甲乙丙丁...)
  earthly_branch: string;   // 지지 (子丑寅卯...)
  stem_element: OhangElement;
  branch_element: OhangElement;
  dominant_element: OhangElement;
}

export function getTodayPillar(date: Date = new Date()): TodayPillar {
  // manseryeok 라이브러리로 해당 날짜의 일주 계산
  // → 천간의 오행 + 지지의 오행 → 지배 원소 결정
}

// 시진(2시간 단위) 원소 매핑
const SHIJIN_ELEMENTS: Record<number, OhangElement> = {
  0: "Water",   // 23-01시 子
  1: "Earth",   // 01-03시 丑
  2: "Wood",    // 03-05시 寅
  3: "Wood",    // 05-07시 卯
  4: "Earth",   // 07-09시 辰
  5: "Fire",    // 09-11시 巳
  6: "Fire",    // 11-13시 午
  7: "Earth",   // 13-15시 未
  8: "Metal",   // 15-17시 申
  9: "Metal",   // 17-19시 酉
  10: "Earth",  // 19-21시 戌
  11: "Water",  // 21-23시 亥
};
```

### 4.5 Zod Schema 매핑

```typescript
// DailyVibeSchema ← schemas.ts Line 229-260 (기존 완비 ✅)
//
// API Input Schema (NEW):
const DailyVibeInputSchema = z.object({
  userId: z.string().uuid(),
  timezone: z.string().default("Asia/Seoul"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
});
//
// Streak Schema (NEW):
const StreakSchema = z.object({
  current_streak: z.number().int().min(0),
  longest_streak: z.number().int().min(0),
  reward_tier: z.enum(["none","bronze","silver","gold"]),
  next_reward_at: z.number().int(),
  is_today_visited: z.boolean(),
});
// Output: DailyVibeSchema (z.infer → DailyVibe type)
```

---

## Feature 5: Chemistry Card Sharing

### 동적 OG 이미지 완벽 연동

### 5.1 Component Tree

```
src/
├── app/api/og/
│   └── route.tsx                          ← 기존 3-mode + 2 new modes
│
├── components/sharing/
│   ├── atoms/
│   │   ├── SharePlatformIcon.tsx          ← 플랫폼별 아이콘
│   │   └── CopyLinkButton.tsx             ← 링크 복사 버튼
│   ├── molecules/
│   │   ├── ChemistryShareCard.tsx         ← 화면 내 미리보기 카드
│   │   ├── ShareSheet.tsx                 ← 공유 시트 (Web Share API + Fallback)
│   │   └── OGPreview.tsx                  ← OG 이미지 실시간 프리뷰
│   └── organisms/
│       └── ShareFlow.tsx                  ← 공유 전체 플로우 관리
│
├── app/(main)/chemistry/
│   └── result/[id]/
│       └── page.tsx                       ← 공유 랜딩 페이지 (SEO)
│
└── lib/sharing/
    ├── og-params.ts                       ← OG URL 파라미터 빌더
    ├── web-share.ts                       ← Web Share API 래퍼
    └── partner-link.ts                    ← 파트너 초대 링크 생성
```

### 5.2 OG Image Route 확장

```
┌──────────────────────────────────────────────────────┐
│ /api/og — 5 MODE ARCHITECTURE                         │
│                                                        │
│ Mode 1: default   ← 기존 ✅ (브랜드 OG)              │
│ Mode 2: profile   ← 기존 ✅ (개인 프로필 OG)         │
│ Mode 3: chemistry ← 기존 ✅ (궁합 OG)                │
│ Mode 4: redflag   ← NEW (위험도 OG)                  │
│ Mode 5: vibe      ← NEW (오늘의 바이브 OG)            │
│                                                        │
│ URL 구조:                                              │
│ /api/og?mode=chemistry                                 │
│   &archetype=The+Maverick                              │
│   &partner=The+Healer                                  │
│   &element=Metal                                       │
│   &partnerElement=Water                                │
│   &score=87                                            │
│   &passion=92&stability=71&growth=85                   │
│   &label=Controlled+Burn                               │
│                                                        │
│ /api/og?mode=redflag                                   │
│   &level=RED                                           │
│   &score=67                                            │
│   &headline=This+person+is+melting+your+Metal          │
│   &flags=3                                             │
│                                                        │
│ /api/og?mode=vibe                                      │
│   &score=78                                            │
│   &keyword=Expansion                                   │
│   &emoji=🌊                                            │
│   &element=Water                                       │
│   &color=%232196F3                                     │
└──────────────────────────────────────────────────────┘
```

### 5.3 Web Share API + Fallback

```typescript
// lib/sharing/web-share.ts
export async function shareResult(params: {
  title: string;
  text: string;
  url: string;
  onSuccess?: (method: 'native' | 'clipboard') => void;
}) {
  // 1. Native Web Share (모바일 최적)
  if (navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      });
      params.onSuccess?.('native');
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // 사용자 취소
    }
  }

  // 2. Fallback: 클립보드 복사
  await navigator.clipboard.writeText(params.url);
  params.onSuccess?.('clipboard');
}
```

### 5.4 Partner Link 시스템

```
┌──────────────────────────────────────────────────────┐
│ PARTNER LINK FLOW                                     │
│                                                        │
│ Person A (기존 사용자):                                │
│ 1. 궁합 분석 요청                                     │
│ 2. 상대방 생년월일 직접 입력 (기본 모드)               │
│    OR                                                  │
│ 3. "파트너 초대 링크 보내기" 클릭                     │
│                                                        │
│ Partner Link 생성:                                     │
│ ┌──────────────────────────────────────────────────┐  │
│ │ URL: ohang.app/chemistry/invite/{token}          │  │
│ │                                                    │  │
│ │ token = base64url({                               │  │
│ │   inviter_id: uuid,                               │  │
│ │   inviter_archetype: "The Maverick",              │  │
│ │   created_at: timestamp,                          │  │
│ │   expires_at: timestamp + 7days                   │  │
│ │ })                                                │  │
│ │                                                    │  │
│ │ Supabase Table: partner_invites                   │  │
│ │ ├── id: uuid                                      │  │
│ │ ├── inviter_id: uuid                              │  │
│ │ ├── token: text (unique)                          │  │
│ │ ├── partner_result_id: uuid (nullable)            │  │
│ │ ├── status: enum(pending,completed,expired)       │  │
│ │ ├── created_at: timestamptz                       │  │
│ │ └── expires_at: timestamptz                       │  │
│ │                                                    │  │
│ │ RLS: inviter_id = auth.uid() OR token match       │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ Person B (초대받은 사람):                               │
│ 1. 링크 클릭 → 오행 분석 온보딩 (무료)                │
│ 2. 생년월일 입력 → Archetype 분석 실행                 │
│ 3. 분석 완료 → 궁합 자동 계산                          │
│ 4. 양쪽 모두에게 Chemistry Card 표시                   │
│ 5. Person A에게 푸시 알림                              │
└──────────────────────────────────────────────────────┘
```

### 5.5 Result 공유 랜딩 페이지

```typescript
// src/app/(main)/chemistry/result/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const result = await getCompatibilityResult(params.id);
  if (!result) return {};

  const ogUrl = buildOGUrl({
    mode: 'chemistry',
    archetype: result.person_a_archetype,
    partner: result.person_b_archetype,
    element: result.person_a_element,
    partnerElement: result.person_b_element,
    score: result.overall_score,
    passion: result.dimension_scores.passion,
    stability: result.dimension_scores.stability,
    growth: result.dimension_scores.growth,
    label: result.chemistry_label,
  });

  return {
    title: `${result.chemistry_label} | ${result.person_a_archetype} × ${result.person_b_archetype}`,
    description: result.headline,
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogUrl],
    },
  };
}
```

---

## Feature 6: Tone Switching UI

### Savage/Balanced/Gentle — 즉시 전환 캐싱

### 6.1 Component Tree

```
src/
├── components/tone/
│   ├── atoms/
│   │   ├── TonePill.tsx                  ← 개별 톤 선택 버튼
│   │   └── ToneIcon.tsx                  ← 🔥/⚖️/🌸 아이콘
│   ├── molecules/
│   │   └── ToneSwitcher.tsx              ← 3-pill 토글 UI
│   └── organisms/
│       └── ToneAwareContent.tsx           ← 톤 전환 시 콘텐츠 리렌더
│
├── providers/
│   └── ToneProvider.tsx                   ← 전역 톤 상태 관리
│
├── hooks/
│   ├── useTone.ts                         ← 톤 상태 훅
│   └── useCachedToneResult.ts             ← 톤별 캐시 결과 훅
│
└── lib/tone/
    ├── cache.ts                           ← 3-tone 클라이언트 캐시
    └── constants.ts                       ← 톤 정의 + 라벨
```

### 6.2 Data Flow + 캐싱 전략

```
┌──────────────────────────────────────────────────────┐
│ TONE SWITCHING — INSTANT SWAP ARCHITECTURE            │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ ToneSwitcher UI                                  │  │
│ │                                                    │  │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│ │  │ 🔥       │ │ ⚖️       │ │ 🌸       │         │  │
│ │  │ Savage   │ │ Balanced │ │ Gentle   │         │  │
│ │  │          │ │ (active) │ │          │         │  │
│ │  └──────────┘ └──────────┘ └──────────┘         │  │
│ │                                                    │  │
│ │ 클릭 시:                                          │  │
│ │ 1. ToneProvider 상태 업데이트 (즉시)              │  │
│ │ 2. 클라이언트 캐시 확인                           │  │
│ │ 3. 캐시 HIT → 즉시 콘텐츠 스왑 (0ms)             │  │
│ │ 4. 캐시 MISS → 서버 요청 + 로딩 표시             │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ CACHING STRATEGY (3-Layer):                           │
│                                                        │
│ Layer 1: Client Memory Cache (useCachedToneResult)    │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Map<string, Record<Tone, AnalysisResult>>         │  │
│ │                                                    │  │
│ │ Key: `${analysisType}:${userId}:${inputHash}`    │  │
│ │ Value: {                                          │  │
│ │   savage:   ArchetypeAnalysis | null,             │  │
│ │   balanced: ArchetypeAnalysis | null,             │  │
│ │   gentle:   ArchetypeAnalysis | null,             │  │
│ │ }                                                  │  │
│ │                                                    │  │
│ │ TTL: Session duration (탭 닫으면 소멸)            │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ Layer 2: Server Cache (Supabase — cache.ts 기존)      │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Key: `${type}:${userId}:${inputHash}:${tone}`    │  │
│ │ TTL: 30일                                         │  │
│ │                                                    │  │
│ │ 최초 분석 시 기본 톤(balanced) 결과만 생성         │  │
│ │ 톤 전환 요청 시 해당 톤 결과 추가 생성             │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ Layer 3: Optimistic Prefetch (백그라운드)              │
│ ┌──────────────────────────────────────────────────┐  │
│ │ 결과 페이지 로드 시:                              │  │
│ │ 1. balanced 결과 즉시 표시 (기본)                  │  │
│ │ 2. 10초 후 savage/gentle 백그라운드 프리페치       │  │
│ │ 3. 프리페치 완료 시 클라이언트 캐시에 저장         │  │
│ │ 4. 사용자가 톤 전환 시 → 즉시 스왑 (0ms 체감)    │  │
│ │                                                    │  │
│ │ 비용 최적화:                                      │  │
│ │ - 무료 사용자: 프리페치 안 함 (balanced only)      │  │
│ │ - Pro 사용자: 모든 톤 프리페치                     │  │
│ │ - Destiny 사용자: 모든 톤 프리페치 + 캐시 영구    │  │
│ └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 6.3 ToneProvider 설계

```typescript
// providers/ToneProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

type Tone = 'savage' | 'balanced' | 'gentle';

interface ToneContextValue {
  tone: Tone;
  setTone: (tone: Tone) => void;
  // 톤별 캐시 관리
  getCachedResult: <T>(key: string) => T | null;
  setCachedResult: <T>(key: string, tone: Tone, result: T) => void;
  // 프리페치 상태
  prefetchStatus: Record<Tone, 'idle' | 'loading' | 'ready'>;
}

const ToneContext = createContext<ToneContextValue | null>(null);

export function ToneProvider({ children }: { children: React.ReactNode }) {
  const [tone, setTone] = useState<Tone>('balanced');
  const [cache] = useState(() => new Map<string, Record<Tone, unknown>>());
  const [prefetchStatus, setPrefetchStatus] = useState<Record<Tone, string>>({
    savage: 'idle', balanced: 'ready', gentle: 'idle',
  });

  const getCachedResult = useCallback(<T,>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    return (entry[tone] as T) ?? null;
  }, [cache, tone]);

  const setCachedResult = useCallback(<T,>(key: string, t: Tone, result: T) => {
    const entry = cache.get(key) ?? { savage: null, balanced: null, gentle: null };
    entry[t] = result;
    cache.set(key, entry);
  }, [cache]);

  const value = useMemo(() => ({
    tone, setTone, getCachedResult, setCachedResult, prefetchStatus,
  }), [tone, getCachedResult, setCachedResult, prefetchStatus]);

  return (
    <ToneContext.Provider value={value}>
      {children}
    </ToneContext.Provider>
  );
}

export function useTone() {
  const ctx = useContext(ToneContext);
  if (!ctx) throw new Error('useTone must be used within ToneProvider');
  return ctx;
}
```

### 6.4 ToneSwitcher UI 컴포넌트

```typescript
// components/tone/molecules/ToneSwitcher.tsx
'use client';

const TONE_CONFIG = {
  savage: {
    icon: '🔥',
    label: { ko: 'Savage', en: 'Savage' },
    description: { ko: '독설가 모드', en: 'Brutally honest' },
    color: '#FF5722',
  },
  balanced: {
    icon: '⚖️',
    label: { ko: 'Balanced', en: 'Balanced' },
    description: { ko: '균형잡힌 분석', en: 'Fair & balanced' },
    color: '#9E9E9E',
  },
  gentle: {
    icon: '🌸',
    label: { ko: 'Gentle', en: 'Gentle' },
    description: { ko: '부드러운 안내', en: 'Warm & supportive' },
    color: '#E91E63',
  },
} as const;

// Framer Motion layoutId로 인디케이터 자연스럽게 이동
// Haptic feedback: haptics.press() on switch
// Transition: 200ms ease-out
```

### 6.5 Zod Schema 매핑

```typescript
// 톤은 기존 모든 스키마의 출력에 영향을 줌 (텍스트 톤만 변경)
// 스키마 구조 자체는 동일, 톤은 INPUT에만 존재
//
// Tone Input Schema (모든 분석에 공통):
const ToneInputSchema = z.object({
  tone: z.enum(["savage","balanced","gentle"]).default("balanced"),
});
//
// 기존 EngineOptions 인터페이스에 이미 tone?: 필드 존재 ✅
// → 추가 스키마 변경 불필요
```

---

## Zod Schema Mapping Matrix

### 전체 Feature → Schema → Engine → API Route 매핑표

```
┌──────────────────┬─────────────────────────┬──────────────────────────┬────────────────────────┬────────────┐
│ Feature          │ Zod Output Schema       │ Engine Method            │ API Route              │ Status     │
├──────────────────┼─────────────────────────┼──────────────────────────┼────────────────────────┼────────────┤
│ Archetype        │ ArchetypeAnalysisSchema  │ streamArchetypeAnalysis  │ /api/analyze/archetype │ ✅ DONE    │
│ Dual-Modal       │ DualModalProfileSchema   │ streamDualModalAnalysis  │ /api/analyze/dual-modal│ ✅ DONE    │
│ Compatibility    │ CompatibilitySchema      │ streamCompatibility  ⚡ │ /api/analyze/compat ⚡ │ 🔴 BUILD   │
│ Face Reading     │ FaceReadingSchema        │ streamFaceReading    ⚡ │ /api/analyze/face   ⚡ │ 🔴 BUILD   │
│ Couple Face Scan │ CoupleFaceScanSchema     │ streamCoupleScan     ⚡ │ /api/analyze/couple ⚡ │ 🟡 Sprint3 │
│ Red Flag Radar   │ RedFlagSchema            │ streamRedFlag        ⚡ │ /api/analyze/redflag⚡ │ 🔴 BUILD   │
│ Retro Mode       │ RetroModeSchema          │ streamRetro          ⚡ │ /api/analyze/retro  ⚡ │ 🟡 Sprint3 │
│ Daily Vibe       │ DailyVibeSchema          │ streamDailyVibe      ⚡ │ /api/vibe/today     ⚡ │ 🔴 BUILD   │
│ Celebrity Match  │ CelebMatchSchema         │ streamCelebMatch     ⚡ │ /api/analyze/celeb  ⚡ │ 🟡 Sprint3 │
├──────────────────┼─────────────────────────┼──────────────────────────┼────────────────────────┼────────────┤
│ OG Image         │ (N/A — Edge Runtime)    │ (N/A)                    │ /api/og              │ ✅+확장⚡  │
│ Streak Reward    │ StreakSchema (NEW)       │ (N/A — DB only)          │ /api/vibe/streak  ⚡ │ 🔴 BUILD   │
│ Share-to-Unlock  │ (N/A — Client only)     │ (N/A)                    │ (N/A)                │ 🔴 BUILD   │
│ Partner Link     │ PartnerInviteSchema(NEW)│ (N/A — DB only)          │ /api/invite       ⚡ │ 🔴 BUILD   │
│ Tone Switching   │ ToneInputSchema (공통)  │ (기존 tone? 활용)        │ (기존 routes 확장)   │ 🔴 BUILD   │
└──────────────────┴─────────────────────────┴──────────────────────────┴────────────────────────┴────────────┘

⚡ = Phase 2에서 신규 구현 필요
```

### New Zod Schemas (Phase 2에서 추가)

```typescript
// lib/schemas/input.ts — Server Action Input Validation

// 1. CompatibilityInputSchema (Feature 1)
// 2. FaceReadingInputSchema (Feature 2)
// 3. RedFlagInputSchema (Feature 3)
// 4. DailyVibeInputSchema (Feature 4)
// 5. StreakSchema (Feature 4 — DB)
// 6. PartnerInviteSchema (Feature 5 — DB)
// 7. ToneInputSchema (Feature 6 — 공통)
// 8. ShareEventSchema (Feature 1 — 바이럴 추적)

const ShareEventSchema = z.object({
  userId: z.string().uuid(),
  contentType: z.enum(["archetype","compatibility","redflag","vibe","face"]),
  contentId: z.string().uuid(),
  platform: z.enum(["native","clipboard","kakao","instagram","twitter"]),
  shared_at: z.string().datetime(),
});

const PartnerInviteSchema = z.object({
  id: z.string().uuid(),
  inviter_id: z.string().uuid(),
  token: z.string().min(32).max(128),
  status: z.enum(["pending","completed","expired"]),
  partner_result_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});
```

---

## Supabase DB Schema Additions

```sql
-- Phase 2 테이블 추가

-- 1. user_streaks (Daily Vibe Streak)
CREATE TABLE user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INT DEFAULT 0 NOT NULL,
  longest_streak INT DEFAULT 0 NOT NULL,
  last_visit_date DATE,
  total_visits INT DEFAULT 0 NOT NULL,
  reward_tier TEXT DEFAULT 'none' CHECK (reward_tier IN ('none','bronze','silver','gold')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- 2. partner_invites (Chemistry Partner Link)
CREATE TABLE partner_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  partner_result_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);
ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inviters can read own invites" ON partner_invites FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "Anyone can read by token" ON partner_invites FOR SELECT USING (true);
CREATE POLICY "Inviters can create invites" ON partner_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- 3. share_events (Viral Tracking)
CREATE TABLE share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('archetype','compatibility','redflag','vibe','face')),
  content_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('native','clipboard','kakao','instagram','twitter')),
  shared_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own shares" ON share_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create shares" ON share_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. daily_vibe_cache (일일 운세 캐시)
CREATE TABLE daily_vibe_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vibe_date DATE NOT NULL,
  tone TEXT DEFAULT 'balanced' CHECK (tone IN ('savage','balanced','gentle')),
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vibe_date, tone)
);
ALTER TABLE daily_vibe_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own vibes" ON daily_vibe_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create vibes" ON daily_vibe_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## File Creation Summary

### 신규 파일 목록 (Phase 2)

```
📁 NEW FILES TO CREATE:

── API Routes ──
src/app/api/analyze/compatibility/route.ts
src/app/api/analyze/face-reading/route.ts
src/app/api/analyze/red-flag/route.ts
src/app/api/vibe/today/route.ts
src/app/api/vibe/streak/route.ts
src/app/api/invite/route.ts

── Pages ──
src/app/(main)/face-reading/page.tsx
src/app/(main)/face-reading/FaceReadingClient.tsx
src/app/(main)/face-reading/actions.ts
src/app/(main)/red-flag/page.tsx
src/app/(main)/red-flag/RedFlagClient.tsx
src/app/(main)/red-flag/actions.ts
src/app/(main)/chemistry/CompatibilityClient.tsx
src/app/(main)/chemistry/actions.ts
src/app/(main)/chemistry/[pair]/page.tsx
src/app/(main)/chemistry/result/[id]/page.tsx

── Components ──
src/components/chemistry/atoms/ScoreRing.tsx
src/components/chemistry/atoms/DimensionBar.tsx
src/components/chemistry/atoms/ElementBadge.tsx
src/components/chemistry/molecules/ChemistryHeader.tsx
src/components/chemistry/molecules/VoidComplementCard.tsx
src/components/chemistry/molecules/NarrativeTimeline.tsx
src/components/chemistry/molecules/SurvivalTipBanner.tsx
src/components/chemistry/organisms/CompatibilityResult.tsx
src/components/chemistry/organisms/PartnerInputForm.tsx
src/components/chemistry/organisms/ShareToUnlockGate.tsx

src/components/face-reading/atoms/ZoneIndicator.tsx
src/components/face-reading/atoms/OfficerBadge.tsx
src/components/face-reading/atoms/ConfidenceTag.tsx
src/components/face-reading/molecules/FaceUploader.tsx
src/components/face-reading/molecules/ZoneAnalysisCard.tsx
src/components/face-reading/molecules/PalaceInsightRow.tsx
src/components/face-reading/molecules/CrossAnalysisBanner.tsx
src/components/face-reading/organisms/FaceReadingResult.tsx
src/components/face-reading/organisms/FaceImageCapture.tsx

src/components/red-flag/atoms/RiskLevelBadge.tsx
src/components/red-flag/atoms/SeverityDot.tsx
src/components/red-flag/atoms/RiskScoreGauge.tsx
src/components/red-flag/molecules/FlagCard.tsx
src/components/red-flag/molecules/PatternRevealCard.tsx
src/components/red-flag/molecules/HiddenStrengthCard.tsx
src/components/red-flag/organisms/RedFlagResult.tsx
src/components/red-flag/organisms/PartnerQuickInput.tsx

src/components/vibe/atoms/VibeScoreBadge.tsx
src/components/vibe/atoms/TimeWindowPill.tsx
src/components/vibe/atoms/LuckyColorDot.tsx
src/components/vibe/atoms/StreakFlameBadge.tsx
src/components/vibe/molecules/VibeCard.tsx
src/components/vibe/molecules/DetailedVibeCard.tsx
src/components/vibe/molecules/TimeWindowBar.tsx
src/components/vibe/molecules/StreakProgressBar.tsx
src/components/vibe/organisms/DailyVibeWidget.tsx
src/components/vibe/organisms/StreakRewardModal.tsx

src/components/tone/atoms/TonePill.tsx
src/components/tone/atoms/ToneIcon.tsx
src/components/tone/molecules/ToneSwitcher.tsx
src/components/tone/organisms/ToneAwareContent.tsx

src/components/sharing/atoms/SharePlatformIcon.tsx
src/components/sharing/atoms/CopyLinkButton.tsx
src/components/sharing/molecules/ChemistryShareCard.tsx
src/components/sharing/molecules/ShareSheet.tsx
src/components/sharing/molecules/OGPreview.tsx
src/components/sharing/organisms/ShareFlow.tsx

── Providers & Hooks ──
src/providers/ToneProvider.tsx
src/hooks/useTone.ts
src/hooks/useCachedToneResult.ts

── Lib ──
src/lib/schemas/input.ts
src/lib/vibe/calendar.ts
src/lib/vibe/streak.ts
src/lib/vibe/notifications.ts
src/lib/sharing/og-params.ts
src/lib/sharing/web-share.ts
src/lib/sharing/partner-link.ts
src/lib/tone/cache.ts
src/lib/tone/constants.ts

── Modified Files ──
src/lib/ai/engine.ts                 ← +4 methods (compat, face, redflag, vibe)
src/app/api/og/route.tsx             ← +2 modes (redflag, vibe)
src/app/(main)/dashboard/page.tsx    ← +DailyVibeWidget integration
src/app/(main)/chemistry/page.tsx    ← 리팩토링 → CompatibilityClient
src/app/layout.tsx                   ← +ToneProvider wrapping

── Database ──
supabase/migrations/YYYYMMDD_phase2_tables.sql
```

---

## Execution Command

### Claude Code 터미널에 붙여넣을 단일 무결점 실행 명령문

아래 명령문은 Phase 2의 모든 디렉토리 구조를 한 번에 생성합니다.
실제 코드 구현은 이 구조 위에 순차적으로 진행하세요.

```bash
cd /path/to/ohang && \
mkdir -p \
  src/app/api/analyze/{compatibility,face-reading,red-flag} \
  src/app/api/vibe/{today,streak} \
  src/app/api/invite \
  src/app/\(main\)/face-reading \
  src/app/\(main\)/red-flag \
  src/app/\(main\)/chemistry/\[pair\] \
  src/app/\(main\)/chemistry/result/\[id\] \
  src/components/chemistry/{atoms,molecules,organisms,templates} \
  src/components/face-reading/{atoms,molecules,organisms,templates} \
  src/components/red-flag/{atoms,molecules,organisms,templates} \
  src/components/vibe/{atoms,molecules,organisms,templates} \
  src/components/tone/{atoms,molecules,organisms} \
  src/components/sharing/{atoms,molecules,organisms} \
  src/providers \
  src/hooks \
  src/lib/schemas \
  src/lib/vibe \
  src/lib/sharing \
  src/lib/tone \
  supabase/migrations && \
echo "✅ Phase 2 directory scaffold complete — $(find src/components -type d | wc -l) component directories created"
```

---

*Generated: 2026-02-19 | OHANG Phase 2 Architecture v2.0*
*Principle: Zero-Defect Architecture × Atomic Design × Server Actions*
