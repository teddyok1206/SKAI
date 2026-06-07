# Judge Calibration 2026-06-07T09:40:35.468Z

- status: passed
- baseUrl: http://127.0.0.1:3013
- sampleCount: 3
- judgeModes: llm
- graphTargetHitRate: 1
- lowConfidenceAnchorRate: 0.175
- duplicateFindingRate: 0

## Ordering Checks

- club-budget-workflow: pass (weak 35, average 65, strong 79; gaps 30/14; annotations yes)


## Results

### club-budget-workflow / weak

- totalScore: 35
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 0.85
- needsHumanReview: true
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 9
- graphMetrics: targetHit 1, lowConfidenceAnchor 0.222, duplicate 0
- graphTargets: pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:material_grounding / pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:bottleneck / pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:decomposition / pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:delegation
- bottlenecks: 문제 정의 및 제약 조건의 모호성, 작업 분해의 부재, AI 지시의 불명확성 및 결과물 계약 부재, 검증 단계 부재 및 자료 활용 미흡
- axisScores: problem_definition 35 / decomposition 35 / instruction_clarity 35 / adaptation 35 / verification 35 / efficiency 35 / final_quality 35

### club-budget-workflow / average

- totalScore: 65
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 0.85
- needsHumanReview: true
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 13
- graphMetrics: targetHit 1, lowConfidenceAnchor 0.308, duplicate 0
- graphTargets: pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:material_grounding / pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:bottleneck / pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:decomposition / pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:verification
- bottlenecks: 문제 정의 및 제약 조건의 모호성, 업무 분해의 상세 부족, 미사용 필수 자료 존재, 검증 절차의 부재
- axisScores: problem_definition 50 / decomposition 50 / instruction_clarity 70 / adaptation 40 / verification 50 / efficiency 70 / final_quality 60

### club-budget-workflow / strong

- totalScore: 79
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 0.95
- needsHumanReview: true
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 18
- graphMetrics: targetHit 1, lowConfidenceAnchor 0.056, duplicate 0
- graphTargets: pair:pair:golden-club-budget-workflow-strong-u4:golden-club-budget-workflow-strong-a4:bottleneck / pair:pair:golden-club-budget-workflow-strong-u2:golden-club-budget-workflow-strong-a2:bottleneck / pair:pair:golden-club-budget-workflow-strong-u1:golden-club-budget-workflow-strong-a1:material_grounding / pair:pair:golden-club-budget-workflow-strong-u1:golden-club-budget-workflow-strong-a1:verification
- bottlenecks: AI 응답에 따른 계획 및 프롬프트 조정이 부족함, 요구된 최종 산출물 형태의 구체성이 부족함, 최종 산출물 형태의 구체성 부족, AI 응답 기반 계획 조정 부족
- axisScores: problem_definition 90 / decomposition 95 / instruction_clarity 90 / adaptation 50 / verification 90 / efficiency 70 / final_quality 60



