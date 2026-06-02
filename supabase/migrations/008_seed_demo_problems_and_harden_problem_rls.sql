insert into public.problems (
  id,
  title,
  subtitle,
  category,
  difficulty,
  goal_profile,
  estimated_minutes,
  statement,
  user_goal,
  constraints,
  starter_context,
  deliverables,
  materials,
  allowed_providers,
  rubric,
  is_published,
  updated_at
) values
(
  'ambiguous-research-brief',
  $$흐릿한 자료조사 요청을 실행 가능한 리서치 브리프로 바꾸기$$,
  $$AI가 헛소리하지 않도록 목표, 검증 기준, 산출물 구조를 먼저 설계한다.$$,
  'research',
  'intro',
  'learning_oriented',
  20,
  $$지인이 '요즘 생성형 AI가 교육에 미치는 영향 좀 조사해줘. 발표에 쓸 거야.'라고만 말했다. 이 요청을 바로 검색/요약하지 말고, AI와 대화하면서 조사 목표, 범위, 산출물 구조, 검증 전략을 설계한 뒤 발표 준비에 쓸 수 있는 리서치 브리프 초안을 만들어라.$$,
  $$불명확한 요청을 구조화하고, AI에게 단계적으로 task를 배분하여 신뢰 가능한 발표용 리서치 브리프를 만든다.$$,
  jsonb_build_array(
    $$처음부터 최종 답만 요구하지 말고 문제를 재정의해야 한다.$$,
    $$최종 산출물에는 조사 질문, 핵심 주장 후보, 검증할 출처 유형, 발표 구조가 포함되어야 한다.$$
  ),
  jsonb_build_array($$발표 대상, 발표 시간, 학년/전공, 최신 자료 필요 여부는 아직 불명확하다.$$),
  jsonb_build_array($$정제된 문제정의$$, $$AI에게 배분한 하위 task 목록$$, $$발표용 리서치 브리프 초안$$, $$검증 계획$$),
  '[]'::jsonb,
  jsonb_build_array('mock', 'groq', 'xai', 'openai', 'openrouter', 'gemini'),
  '[]'::jsonb,
  true,
  now()
),
(
  'club-budget-workflow',
  $$동아리 예산 혼란을 AI 업무흐름으로 정리하기$$,
  $$사람, 문서, AI가 나눠 맡을 일을 설계한다.$$,
  'strategy',
  'standard',
  'workflow_adoption',
  25,
  $$동아리 회계 담당자가 영수증 사진, 계좌이체 내역, 구글폼 신청 내역이 뒤섞여 예산 정산을 못 하고 있다. AI를 활용해 정산 업무를 안정적으로 처리하는 workflow를 설계하고, 실제 담당자가 따라 할 수 있는 운영 절차를 만들어라.$$,
  $$현실 업무의 혼란을 AI task, 사람 검토, 데이터 구조로 나누고 재사용 가능한 workflow로 만든다.$$,
  jsonb_build_array(
    $$AI가 하면 안 되는 판단과 사람이 검토해야 할 지점을 분리해야 한다.$$,
    $$개인정보나 계좌정보 처리 주의사항을 포함해야 한다.$$,
    $$반복 운영 가능한 체크리스트 또는 템플릿을 만들어야 한다.$$
  ),
  jsonb_build_array($$입력 자료는 완전히 정리되어 있지 않다.$$),
  jsonb_build_array($$업무 분해도$$, $$AI task 분배안$$, $$사람 검토 지점$$, $$운영 체크리스트$$, $$실패 시나리오 대응책$$),
  jsonb_build_array(
    jsonb_build_object('id', 'receipt-001', 'title', $$영수증 사진: 문구점 소모품$$, 'kind', 'image'),
    jsonb_build_object('id', 'transfers-001', 'title', $$계좌이체 내역: 5월 행사$$, 'kind', 'spreadsheet'),
    jsonb_build_object('id', 'signup-001', 'title', $$구글폼 신청 내역 CSV$$, 'kind', 'csv')
  ),
  jsonb_build_array('mock', 'groq', 'xai', 'openai', 'openrouter', 'gemini'),
  '[]'::jsonb,
  true,
  now()
),
(
  'counterfactual-product-review',
  $$그럴듯하지만 약한 제품 리뷰 분석 바로잡기$$,
  $$AI의 약한 분석을 잡아내고 더 강한 검증 프롬프트로 되돌린다.$$,
  'data_analysis',
  'advanced',
  'accuracy_first',
  30,
  $$가상의 앱 리뷰 12개를 보고 AI에게 개선 우선순위를 뽑게 해야 한다. 단, 리뷰 수가 적고 편향되어 있을 수 있다. AI가 성급하게 결론내리지 않도록 분석 계획, 한계, 검증 질문, 최종 우선순위를 설계하라.$$,
  $$작은 데이터에서 AI가 과잉 일반화하지 않도록 제약을 걸고 검증 중심의 분석을 만든다.$$,
  jsonb_build_array(
    $$데이터 한계를 명시해야 한다.$$,
    $$분석 기준을 먼저 만들고 리뷰를 분류해야 한다.$$,
    $$AI가 만든 우선순위에 대한 반례나 리스크를 검토해야 한다.$$
  ),
  jsonb_build_array($$리뷰 데이터는 대표성이 보장되지 않는다.$$),
  jsonb_build_array($$분석 기준$$, $$리뷰 분류 전략$$, $$AI 출력 검증 질문$$, $$우선순위와 근거$$, $$추가 데이터 수집 계획$$),
  '[]'::jsonb,
  jsonb_build_array('mock', 'groq', 'xai', 'openai', 'openrouter', 'gemini'),
  '[]'::jsonb,
  true,
  now()
)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  category = excluded.category,
  difficulty = excluded.difficulty,
  goal_profile = excluded.goal_profile,
  estimated_minutes = excluded.estimated_minutes,
  statement = excluded.statement,
  user_goal = excluded.user_goal,
  constraints = excluded.constraints,
  starter_context = excluded.starter_context,
  deliverables = excluded.deliverables,
  materials = excluded.materials,
  allowed_providers = excluded.allowed_providers,
  rubric = excluded.rubric,
  is_published = true,
  updated_at = now();

drop policy if exists "Authenticated users can seed demo problems" on public.problems;
drop policy if exists "Authenticated users can update demo problems" on public.problems;
