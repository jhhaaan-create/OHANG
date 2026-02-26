# OHANG 보안 체크리스트

모든 PR은 머지 전 아래 항목을 확인해주세요.

---

## 1. 환경변수 — 하드코딩 금지

| 규칙 | 설명 |
| --- | --- |
| `.env.example`에 정의된 키만 사용 | 새 키 추가 시 `.env.example`도 함께 업데이트 |
| `process.env.XXX`로만 접근 | 문자열 리터럴로 직접 키 값 작성 금지 |
| `.env.local`은 절대 커밋 금지 | `.gitignore`에 이미 등록됨 |
| `NEXT_PUBLIC_` 접두사 규칙 준수 | 브라우저 노출 가능 키만 `NEXT_PUBLIC_` 사용 |

### 감사 명령어
```bash
npx tsx scripts/audit-env.ts
```

---

## 2. Supabase RLS — 전 테이블 필수

| 규칙 | 설명 |
| --- | --- |
| `CREATE TABLE` 후 반드시 `ENABLE ROW LEVEL SECURITY` | 예외 없음 |
| 최소 1개의 `CREATE POLICY` 정의 필수 | SELECT/INSERT/UPDATE/DELETE 각각 필요한 것만 |
| `service_role` 키는 서버 전용 | `app/`, `components/`에서 사용 금지 |
| `.rpc()` 호출 시 `security_definer` 확인 | RLS 우회 가능성 검토 |

### SQL 템플릿
```sql
-- 테이블 생성
CREATE TABLE public.example (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화 (필수!)
ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 데이터만 조회
CREATE POLICY "Users can view own data"
  ON public.example FOR SELECT
  USING (auth.uid() = user_id);

-- 정책: 본인만 삽입
CREATE POLICY "Users can insert own data"
  ON public.example FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 감사 명령어
```bash
npx tsx scripts/audit-rls.ts
```

---

## 3. 관상 이미지 — 즉시 폐기

| 규칙 | 설명 |
| --- | --- |
| API 호출 후 즉시 메모리에서 삭제 | `Buffer`나 `base64` 변수 null 처리 |
| Supabase Storage에 저장 금지 | 버킷에 업로드하지 않음 |
| DB에 이미지 데이터 저장 금지 | URL, blob, base64 모두 금지 |

---

## 4. 빠른 점검 (커밋 전)

```bash
# 1) 하드코딩 검사
npx tsx scripts/audit-env.ts

# 2) RLS 검사
npx tsx scripts/audit-rls.ts

# 3) 빌드 확인
npm run build
```
