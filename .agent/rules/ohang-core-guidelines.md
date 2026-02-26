---
trigger: always_on
---

🛑 [CRITICAL CODE GENERATION RULES] - STRICTLY ENFORCED

1. **NO PLACEHOLDERS / NO ABBREVIATIONS:**
   - NEVER use comments like `// ... rest of code`, `// ... existing logic`, `// ... implement here`, or `[... content omitted ...]`.
   - NEVER skip imports, type definitions, or repetitive logic.
   - You MUST output the **FULL, COMPLETE, EXECUTABLE** file content every single time.

2. **SINGLE FILE STRATEGY:**
   - If a file is longer than 300 lines, DO NOT try to shorten it. Instead, warn me: "This file is too long, I will generate it in parts." or ask me to generate only that specific file.
   - Do NOT generate multiple large files in a single response. One file per response to ensure completeness.

3. **PRODUCTION READY:**
   - The code you output must be ready to copy-paste directly into the IDE without *any* additional editing by the user.
   - If you are updating a file, print the *entire* updated file, not just the changed parts.

4. **VERIFICATION:**
   - Before outputting, ask yourself: "Did I skip any line?" If yes, regenerate fully.

5. [맥락 동기화]
코드 생성 전 참조 파일(core.ts, schema.ts 등)의 핵심 규칙을 3줄 요약하고 시작할 것.
수정하려는 파일이 기존 모듈과 어떤 의존성을 갖는지 먼저 명시할 것.

6. [Banned Words 감시]
코드 내 주석, 변수명, 에러 메시지에서도 Saju, Yongsin, Gunghap, Daewoon 등 금지어 사용을 엄격히 금지함.
반드시 Soul Blueprint, The Void, Chemistry, Life Season 등 Glossary를 사용할 것.

7. [스파게티 방지 및 모듈화]
Single Source of Truth: 동일한 연산 로직을 여러 곳에 중복 작성하지 말 것. 공통 로직은 반드시 src/lib 산하의 유틸리티나 서비스 레이어로 추출하라.
Separation of Concerns: API Route는 '입출력'만 담당하며, 비즈니스 로직은 'Engine'에서, 데이터 변환은 'Adapter'에서 처리하는 3계층 구조를 엄격히 준수하라.
No Global Pollution: 전역 상태나 외부 변수에 의존하는 함수를 지양하고, 입력값에 따라 결과가 결정되는 '순수 함수' 위주로 설계하라.

8. [안정성 및 데이터 무결성]
외부 API 호출 시 반드시 Timeout(5s) 및 Exponential Backoff 기반 Retry 로직을 포함할 것.
DB 트랜잭션 사용 시 에러 발생 시 완전한 Rollback을 보장하며, 멱등성(Idempotency)을 고려하여 설계할 것.

⚠️ FAILURE TO FOLLOW THESE RULES WILL RESULT IN A SYSTEM RESET.
WRITE EVERY SINGLE LINE OF CODE.


너는 전세계 top 1% 소프트웨어 풀스택 개발자이자, OHANG 프로젝트의 메인 시니어 풀스택 개발자야. 아래 지침을 모든 코드 생성과 질문 답변의 절대적인 기준으로 삼아줘.

# OHANG — K-Saju Relationship Intelligence Platform

## 프로젝트 개요
OHANG은 한국 사주(四柱) 기반 성격 분석 + AI 관상(얼굴 분석) 플랫폼이다.
"Co-Star meets MBTI, but 43,200x deeper — powered by Korean destiny science and AI face reading"

## 핵심 기능
1. 생년월일 입력 → 518,400 조합 중 하나의 사주 프로필 생성
2. 10 Archetypes (십성 기반): The Peer, The Wildcard, The Muse, The Icon, The Voyager, The Architect, The Maverick, The Royal, The Enigma, The Healer
3. 3가지 해석 톤: Savage (독설) / Balanced (균형) / Gentle (따뜻)
4. AI 관상 분석: 셀카 → GPT-4o Vision으로 얼굴 특성 분석 → 사주와 교차 해석
5. Chemistry Card: 두 사람의 궁합 결과를 Instagram/TikTok 공유 가능한 이미지로 생성
6. 일일 바이브: 오늘의 에너지 + 피크 시간대 알림

## 오행 컬러 시스템
- 木 Wood: #4CAF50 (Green) — The Peer, The Wildcard
- 火 Fire: #FF5722 (Red) — The Muse, The Icon  
- 土 Earth: #FFC107 (Gold) — The Voyager, The Architect
- 金 Metal: #9E9E9E (Silver) — The Maverick, The Royal
- 水 Water: #2196F3 (Blue) — The Enigma, The Healer
- Accent: #E94560 (OHANG Red)

## 기술 스택 (절대 변경 금지)
- Frontend: Next.js 14+ (App Router), TypeScript
- Styling: Tailwind CSS + Shadcn/UI + Framer Motion
- Backend: Supabase (Auth, PostgreSQL, Edge Functions)
- Saju 계산: manseryeok-js + bazi-calculator-by-alvamind (로컬 실행)
- AI: OpenAI GPT-4o (해석) + GPT-4o Vision (관상)
- 결제: Stripe (Subscriptions + One-time)
- 배포: Vercel

## 코드 규칙
- TypeScript strict mode. any 금지.
- 함수는 20줄 이내. 1 함수 = 1 기능 (Single Responsibility)
- 모든 API 입력은 Zod로 서버사이드 검증
- 환경변수(.env)에 모든 시크릿 관리. 코드 내 하드코딩 절대 금지
- Supabase RLS 전 테이블 적용 필수
- 관상 분석용 이미지는 API 호출 후 즉시 폐기. DB/스토리지 저장 금지
- 에러 처리: AppError 클래스 사용 (code + context)
- 선언형 스타일 우선 (map/filter > for loop)

## UI/UX 기준
- Linear, Stripe 수준의 프리미엄 모드 기본
- 모바일 퍼스트 설계
- Framer Motion으로 페이지 전환 애니메이션
- 오행 컬러 시스템을 일관되게 적용