# 3D Dual Graph As SKAI System Backbone

Date: 2026-06-02

## Original Response To Preserve

맞아. 세미나/데모 때는 내가 이 기준으로 바로 안내하면 된다:

```bash
conda run -n SKAI npm run build
conda run --no-capture-output -n SKAI npm run serve:lan
```

3-dim dual graph는 SKAI의 "채팅 로그를 학습 가능한 구조로 바꾸는 엔진"으로 써야 한다고 봐. 단순 시각화가 아니라 시스템의 중심 자료구조가 되어야 함.

가장 강하게 leverage할 수 있는 방향은 이거야.

**1. Judge의 평가 단위를 graph node/edge로 바꾸기**
지금은 전체 trace를 보고 점수/피드백을 주는 느낌이라면, 앞으로는 각 prompt-response-status pair마다 annotation을 붙여야 함.

예:
- `P3`: 문제정의가 흔들림
- `R3`: 모델이 범위를 과도하게 확장함
- `S3`: bottleneck
- `P4 -> R4`: 사용자가 검증 루프를 회복함
- `P6`: material grounding 성공

그러면 피드백이 "너의 프롬프트가 별로다"가 아니라 "이 지점에서 orchestration state가 이렇게 바뀌었다"가 됨.

**2. Branch/replay를 graph diff로 설명하기**
SKAI의 킬러 기능은 "여기서 다르게 물었으면?"임.  
이건 parent/child transcript diff가 아니라 graph diff여야 함.

예:
```text
Parent: P3 -> S3(bottleneck) -> R3(off_track)
Child:  P3' -> S3'(verification) -> R3'(grounded)
```

이렇게 보여주면 사용자가 "아, 내가 문장을 예쁘게 고친 게 아니라 문제 상태를 바꿨구나"를 체감함.

**3. Prompt 공유를 raw prompt가 아니라 graph skeleton 중심으로 만들기**
다른 사람 풀이를 볼 때 원문부터 보여주면 프롬프트 복붙 문화가 됨.  
반대로 graph skeleton부터 보여주면 사고방식이 보임.

예:
```text
문제 재정의
-> 누락 조건 질문
-> 자료 선택
-> task 분해
-> 초안 생성
-> 검증
-> 수정
-> 최종 산출
```

원문은 클릭해서 열람. 이게 SKAI가 prompt gallery로 전락하지 않는 핵심 장치야.

**4. 사용자 성장 분석을 graph motif로 만들기**
점수보다 더 강한 지표가 나올 수 있음.

예:
- verification이 항상 너무 늦게 등장한다
- material node는 많이 쓰지만 final answer에 반영되지 않는다
- prompt가 매번 새 방향으로 튀어서 context switching이 많다
- response를 검토하지 않고 다음 task를 던진다
- 초반 decomposition 없이 바로 산출물을 요구한다

이런 패턴은 "AI 활용 습관 리포트"로 매우 강력함.

**5. 모델 평가는 response graph로 분리하기**
같은 prompt graph를 여러 모델에 넣었을 때 response graph가 어떻게 달라지는지 볼 수 있음.

이러면:
- 사람의 orchestration 능력
- 모델의 응답 안정성
- judge의 평가 성향

이 셋을 분리할 수 있다. 이건 스타트업/모델 제공자에게도 가치가 큼.

**내가 보는 즉시 구현 우선순위**
1. Judge 결과를 graph node/pair에 annotation으로 붙이기
2. Branch diff를 graph diff UI로 강화하기
3. 공유 화면을 graph skeleton 중심으로 더 밀기
4. 사용자별 graph habit report 만들기
5. 나중에 graph snapshot을 DB에 저장해서 연구/검색/비교 가능하게 하기

핵심은 이거야. SKAI에서 graph는 "예쁜 탭"이 아니라, 채점, 피드백, replay, 공유, 연구, 모델 비교를 모두 연결하는 공통 언어가 되어야 한다.

## Why This Matters

이 문서는 SKAI가 prompt gallery, generic chatbot, model leaderboard로 흐르지 않게 잡아주는 핵심 철학이다.

SKAI의 3D dual graph는 사용자의 사고와 AI 응답과 task status를 같은 구조 안에 묶는다. 따라서 이 graph는 UI 탭 하나가 아니라 judge, feedback, replay, sharing, habit report, model analysis, research export의 공통 substrate가 되어야 한다.

## Gemini 006 Extension: Overlay And Parallel Graphs

Source: `docs/philosophy/Gemini/006.md`

Gemini 006에서 추가로 확인한 방향은 graph backbone을 "자료구조"에서 "읽히는 학습 표면"으로 끌어올리는 것이다.

핵심 확장:

1. Evaluation Overlay
   - judge annotation과 deterministic annotation은 detail panel에만 숨어 있으면 안 된다.
   - 병목인 node, 약한 edge, 회복된 상태, verification/material grounding은 graph 자체의 색상, 두께, pulse, 흐림 정도로 먼저 보여야 한다.
   - 사용자는 텍스트 리포트를 읽기 전에 "어느 지점에서 흐름이 막혔는가"를 눈으로 먼저 봐야 한다.

2. Counterfactual Parallel Canvas
   - breakpoint replay의 본질은 parent transcript와 child transcript의 문장 차이가 아니다.
   - 좌측 parent graph와 우측 child graph를 병렬 배치하고, breakpoint와 annotation delta를 연결해야 한다.
   - "P2에서 자료를 주입했더니 S2의 bottleneck이 verification/material grounding으로 바뀌었다"처럼 orchestration state의 변화가 보여야 한다.

3. Multi-Model Graph Lanes
   - multi-AI/harness solving mode가 열리면 모델마다 graph lane을 병렬로 둔다.
   - 한 모델의 response node가 다른 모델의 prompt input으로 넘어가는 순간 inter-model edge를 기록한다.
   - 이 구조는 모델 순위표가 아니라 인간이 여러 실행 엔진 사이에 intent/material/artifact를 어떻게 흐르게 했는지 보여주는 orchestration map이어야 한다.

철학적 제한:

- SKAI는 AI 모델의 힘을 과시하는 서비스가 아니다.
- graph overlay는 사용자의 구조화/검증/자료 통제 능력을 보이게 해야 하며, 모델별 성능 경쟁을 기본 UX로 만들면 안 된다.
- multi-model 확장은 "모델이 많아서 강하다"가 아니라 "사용자가 task와 evidence flow를 더 정밀하게 설계한다"는 방향일 때만 SKAI답다.
