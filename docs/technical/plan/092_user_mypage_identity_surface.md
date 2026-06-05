# 092 User My Page And Identity Surface

## 목적

Google login이 들어온 상태에서 유저별 마이페이지를 만든다. 목표는 일반 SaaS의 설정/개인정보 페이지를 복제하는 것이 아니라, SKAI에서 한 사용자가 남긴 **Orchestration identity**, 데이터 소유권, 공유/공개 상태, 학습 진행 신호를 한 곳에서 확인하게 만드는 것이다.

이 slice의 핵심 질문:

- 사용자는 자신이 어떤 계정으로 들어왔는지 확인할 수 있는가?
- 자신의 attempt, published share, comment identity, local-only 데이터와 Supabase-synced 데이터를 구분할 수 있는가?
- SKAI가 수집/보관하는 데이터가 무엇인지 최소한의 언어로 설명할 수 있는가?
- 이후 judge/coaching, certification, portfolio로 확장해도 데이터 구조가 불필요하게 커지지 않는가?

## 철학 기준

마이페이지는 점수 자랑판이나 일반 SNS 프로필이 아니다.

SKAI의 마이페이지는 다음을 보여주는 개인 제어실이어야 한다.

- 내가 남긴 Prompt/Response/Status graph의 규모와 흐름
- 내가 어떤 문제 유형에서 orchestration을 연습했는지
- 내가 공개한 `.skai`/share artifact가 무엇인지
- 내 trace가 local-only인지, Supabase에 sync됐는지
- 커뮤니티에서 쓰이는 표시 이름과 privacy setting이 무엇인지

Anti-goal:

- global leaderboard 중심의 경쟁 유도
- AI 모델 사용량 대시보드로의 축소
- generic account settings page
- “프롬프트 템플릿 저장소” 같은 prompt trick UI
- 과도한 개인정보 수집

## 현재 구조 관찰

- Supabase auth는 Google login/callback으로 동작한다.
- `attempts.user_id`, `prompt_comments.user_id`, `published_attempts.attempt_id -> attempts.user_id` 관계가 이미 있다.
- 별도 `profiles` 테이블은 아직 없다.
- `AuthStatus`는 로그인 상태에서 이메일을 sign-out 버튼 텍스트로 직접 보여준다.
- 공개 댓글 작성 시 author label은 입력값 또는 이메일 prefix fallback을 쓴다.
- localStorage에는 local attempts, authored problems, founder notes, generated problem editorial state가 있다.
- i18n registry가 운영 중이므로 새 UI copy는 registry key로 추가해야 한다.

## 1차 제품 범위

Route:

- `/me`

Navigation:

- 로그인 상태의 topbar에 `My SKAI` 또는 계정 아이콘 링크를 추가한다.
- 로그아웃은 마이페이지 안에서도 가능하게 하되, 기존 topbar sign-out 흐름은 단순하게 유지한다.
- 비로그인 상태에서 `/me` 진입 시 sign-in CTA와 local demo 안내를 보여준다.

Page sections:

1. Identity
   - email
   - display name
   - provider (`google`)
   - account created/last sign-in if Supabase metadata로 안전하게 접근 가능할 때만 표시

2. SKAI Profile
   - public display name
   - optional short bio/tagline
   - preferred language
   - default share author label
   - settings save

3. Data Control
   - local-only data exists 여부
   - Supabase synced attempts count
   - published share count
   - comments count
   - 설명: prompt/response trace는 문제 풀이와 feedback을 위해 저장될 수 있으며, 공개 share는 별도 publish action을 거친다.

4. Orchestration Snapshot
   - total attempts
   - judged attempts
   - published attempts
   - prompt count / response count
   - branch count
   - material attachment count if cheaply available
   - estimated total cost if already stored in trace events

5. Recent Artifacts
   - 최근 attempt 5개
   - 문제 title, provider/model, status, createdAt, share 여부
   - 링크: local attempt detail surface가 아직 없으므로 1차는 share link 또는 problem link 중심으로 둔다.

6. Privacy And Export
   - `.skai` export/viewer 철학 안내
   - “공개한 artifact만 외부에서 볼 수 있음” 명시
   - 삭제/탈퇴는 1차에서 실제 destructive action으로 구현하지 않고 “manual request / future slice”로 둔다.

## 백엔드 설계

최대한 단순한 구조:

```sql
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'SKAI learner',
  bio text,
  preferred_locale text not null default 'ko',
  default_author_label text not null default 'SKAI learner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS:

```sql
alter table public.user_profiles enable row level security;

create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Index:

- primary key만으로 충분하다.

Migration:

- `supabase/migrations/011_user_profiles.sql`

API:

- `GET /api/me`
  - auth user 확인
  - profile row 없으면 fallback profile 반환
  - attempts/score/published/comment summary를 aggregate해서 반환
  - RLS user scope만 사용한다. service role은 사용하지 않는다.

- `PATCH /api/me/profile`
  - displayName, bio, preferredLocale, defaultAuthorLabel만 허용
  - zod로 길이 제한
  - upsert with `user_id = auth.uid()`

Why API route:

- Client에서 Supabase를 직접 여러 테이블로 조회해도 되지만, 마이페이지는 account/privacy surface라 한 API에서 shape를 고정하는 편이 이후 `.skai` export, judge/coaching, certification 확장에 안정적이다.
- Backend summary가 있으면 프론트는 display만 책임진다.

## 데이터 shape 초안

```ts
interface MyPageSnapshot {
  mode: "supabase" | "local";
  authenticated: boolean;
  user?: {
    id: string;
    email?: string;
    provider?: string;
    createdAt?: string;
    lastSignInAt?: string;
  };
  profile?: {
    displayName: string;
    bio?: string;
    preferredLocale: "ko" | "en";
    defaultAuthorLabel: string;
    updatedAt?: string;
  };
  summary: {
    attempts: number;
    judgedAttempts: number;
    publishedAttempts: number;
    comments: number;
    branches: number;
    userPrompts: number;
    assistantResponses: number;
    totalEstimatedCostUsd: number;
  };
  recentAttempts: Array<{
    id: string;
    problemId: string;
    title: string;
    status: AttemptStatus;
    provider: ProviderId;
    model: string;
    publishedAttemptId?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

## 프론트엔드 설계

Files:

- `app/me/page.tsx`
- `components/my-page-client.tsx`
- `app/api/me/route.ts`
- `app/api/me/profile/route.ts`
- `lib/my-page.ts` 또는 `lib/account.ts`
- `supabase/migrations/011_user_profiles.sql`

UI direction:

- 카드 남발 금지. full-width bands + compact panels.
- 첫 화면은 “계정 정보”보다 “My SKAI graph control surface” 느낌이어야 한다.
- 상단에 3-spine mini graph summary:
  - Prompt spine count
  - Response spine count
  - Status/artifact count
  - published artifact count
- 그래프는 decorative가 아니라 실제 summary count와 연결한다.
- 설정 form은 아래쪽 compact panel로 둔다.

Copy:

- `myPage.*` registry key 추가
- 한국어/English 모두 approved 또는 draft/stale 규칙 준수
- `SKAI`, `.skai`, `Orchestration`, `Trace`, `Artifact`, `3D Dual Graph` protected terms 유지

## 홈페이지 graph-like 아이디어와 분리

홈페이지 자체를 graph-like하게 만드는 아이디어는 좋다. 다만 이 slice에서 같이 구현하지 않는다.

이유:

- 마이페이지는 account/privacy/backend shape가 핵심이다.
- 홈페이지 graph-like UI는 first impression/brand/navigation 정보 구조가 핵심이다.
- 둘을 동시에 바꾸면 UX 회귀 원인을 분리하기 어렵다.

후속 slice 후보:

- `093_home_graph_entry_surface`
- 홈 hero를 “문제 목록 위 장식”이 아니라 `Intent + Materials -> Orchestration -> Artifact`의 실제 entry map으로 재구성한다.
- 각 node는 실제 route로 이어진다.
  - Intent: 문제 선택
  - Materials: 자료 기반 문제
  - Orchestration: 풀이/trace
  - Artifact: `.skai` viewer/share
- 단, landing page처럼 설명문이 길어지지 않게 한다.

## 구현 순서

### Slice A: Plan and schema

1. 이 plan 문서를 확정한다.
2. `011_user_profiles.sql` migration을 추가한다.
3. profile RLS를 추가한다.
4. local type/schema를 정의한다.

### Slice B: API

1. `GET /api/me` 구현
2. `PATCH /api/me/profile` 구현
3. Supabase 미설정/비로그인 fallback shape 정의
4. aggregate query 최소화
   - attempts select 1회
   - published attempts select 1회
   - comments count select 1회
   - score/judged 여부는 attempts + score_reports relation이 복잡하면 별도 count query

### Slice C: UI

1. `/me` route 추가
2. `MyPageClient` 구현
3. topbar link 추가
4. profile edit form 추가
5. local-only 안내 추가
6. `.skai`/share/export 설명 추가

### Slice D: i18n and docs

1. `myPage.*`, `nav.mySkai`, auth/account copy 추가
2. `verify:i18n` baseline 갱신
3. `docs/000_orchestration.md` 현재 상태 갱신

### Slice E: Verification

1. `npm run verify:i18n`
2. `conda run -n SKAI npm run typecheck`
3. `conda run -n SKAI npm run lint`
4. `conda run -n SKAI npm run build`
5. `npm run verify:skai`
6. 로그인/비로그인 `/me` 수동 smoke

## 보안/운영 원칙

- API route에서 반드시 `supabase.auth.getUser()` 사용
- body로 받은 `userId` 신뢰 금지
- RLS로 own profile만 읽고 쓰게 한다.
- destructive delete/account removal은 이번 slice에서 제외한다.
- 이메일은 account identity로 표시하되 public profile 기본값으로 그대로 쓰지 않는다.
- displayName/defaultAuthorLabel은 max length와 sanitization을 둔다.
- profile 저장 실패 시 local fallback을 만들지 않는다. 계정 설정은 auth-backed 데이터여야 한다.

## 리스크

- Supabase migration이 적용되지 않은 production에서 `/me` API가 실패할 수 있다.
  - 대응: missing table error는 설정 안내로 degrade하거나, migration 필요 메시지를 반환한다.
- attempt aggregation이 커지면 느려질 수 있다.
  - 대응: 1차는 최근 N개와 count 중심. 나중에 materialized summary 또는 profile_stats table 고려.
- 사용자에게 너무 많은 통계를 보여주면 score grinder로 흐를 수 있다.
  - 대응: 점수보다 Trace/Artifact/공개 상태/데이터 제어를 우선 배치한다.

## 완료 조건

- 로그인 사용자가 `/me`에서 자신의 계정, profile setting, orchestration summary, 최근 artifact를 볼 수 있다.
- 비로그인 사용자는 로그인 CTA와 local demo 상태 설명을 본다.
- profile 저장은 `user_profiles` RLS 아래에서 동작한다.
- `.skai`/share와 private trace의 차이가 UI에서 명확하다.
- 새 UI copy는 registry에서 렌더링된다.
- 기존 solve/share/viewer/judge 회귀가 없다.

## 상태

- 계획 완료. 구현 전.
