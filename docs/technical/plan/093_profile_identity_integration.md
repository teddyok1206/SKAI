# 093 Profile Identity Integration

## 목적

`/me`에서 만든 SKAI Profile을 실제 공유/댓글/언어 흐름에 연결한다. 마이페이지가 단순 설정 화면이 아니라, 사용자가 자신의 문제 해결 방식과 Prompt/Response trace를 공개하고 파트별로 토론하는 identity backbone이 되게 만든다.

## 핵심 철학

- SKAI의 공유 단위는 단순 최종 답변이 아니라 Prompt/Response/Status trace와 `.skai` Artifact다.
- 사용자는 자신의 문제 해결 방식, prompt 흐름, 자료 사용, 검증 습관을 공유할 수 있어야 한다.
- 커뮤니티 댓글은 전체 게시글 댓글만이 아니라 특정 Prompt/Response 파트에 달릴 수 있어야 한다.
- profile identity는 이 공유/댓글 맥락에서 쓰이는 공개 이름과 기본 언어 preference를 관리한다.

## 범위

- `user_profiles.default_author_label`을 share comment 작성 기본 이름으로 사용한다.
- comment API의 서버 fallback도 profile display/default label을 email prefix보다 우선하게 한다.
- `user_profiles.preferred_locale`을 로그인 사용자의 초기 language preference로 반영한다.
- `/me` profile form에 해당 profile이 공유 댓글/공개 Artifact에서 어디에 쓰이는지 명확히 표시한다.
- SQL migration 미적용 또는 profile table unavailable 상태에서도 graceful fallback을 유지한다.
- `AGENT.md`와 orchestration 문서에 “사용자의 문제 해결 방식 공유와 Prompt/Response 파트별 댓글” 철학을 명시한다.

## 비범위

- 홈페이지 redesign은 다루지 않는다.
- 공개 프로필 페이지, 팔로우, global leaderboard는 다루지 않는다.
- comment thread data model을 바꾸지 않는다. 이미 `trace_event_id` 기반 파트별 댓글 구조가 있으므로 이를 profile identity와 연결한다.

## 구현 계획

1. `/api/me` snapshot을 재사용해 share 화면의 author name 초기값을 profile `defaultAuthorLabel`로 설정한다.
2. 사용자가 comment name input을 직접 수정한 경우 profile fetch가 뒤늦게 와도 덮어쓰지 않는다.
3. `/api/comments` POST에서 profile row를 조회하고, incoming author name이 기본 placeholder 수준이면 profile default/display name을 우선 사용한다.
4. `AuthStatus` 또는 공통 auth surface에서 로그인 사용자의 profile `preferredLocale`을 localStorage locale이 없을 때만 적용한다.
5. `/me` profile panel에 profile usage note를 추가한다.
6. copy registry에 필요한 `myPage.profile.usage` 등 key를 추가한다.
7. 문서와 AGENT 지침을 업데이트한다.

## 검증

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `npm run verify:skai`

## 리스크

- profile table migration이 production에 적용되지 않으면 `/api/me`와 comment fallback profile lookup은 fallback으로 동작해야 한다.
- 사용자가 직접 입력한 comment name을 profile sync가 덮어쓰면 안 된다.
- language preference는 명시적 local toggle을 우선해야 한다. 로그인할 때마다 profile locale이 local selection을 강제로 바꾸면 안 된다.

## 상태

## 구현 결과

- `loadMyPageSnapshot()` client helper를 추가해 `/api/me` snapshot을 재사용한다.
- share 화면의 comment author name 초기값은 profile `defaultAuthorLabel` 또는 `displayName`을 우선 사용한다.
- 사용자가 author name input을 직접 수정한 경우 profile fetch가 뒤늦게 도착해도 덮어쓰지 않는다.
- `POST /api/comments` 서버 fallback도 `user_profiles.default_author_label`/`display_name`을 email prefix보다 우선 사용한다.
- `AuthStatus`는 로그인 사용자의 profile `preferredLocale`을 localStorage locale이 없을 때만 초기값으로 적용한다.
- `/me` profile panel에 profile이 Prompt/Response 파트별 댓글 작성자명과 초기 언어 설정에 쓰인다는 안내를 추가했다.
- `AGENT.md`와 `docs/000_orchestration.md`에 공유/파트별 댓글 철학을 고정했다.

## 검증 결과

- `npm run verify:i18n` 통과.
- `conda run -n SKAI npm run typecheck` 통과.
- `conda run -n SKAI npm run lint` 통과.
- `conda run -n SKAI npm run build` 통과.
- `npm run verify:skai` 통과.

## 상태

- 완료.
