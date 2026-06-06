# Judge Calibration 2026-06-06T19:14:57.844Z

- status: passed
- baseUrl: http://127.0.0.1:3013
- sampleCount: 3
- judgeModes: llm

## Ordering Checks

- ambiguous-research-brief: pass (weak 35, average 65, strong 86; gaps 30/21; annotations yes)


## Results

### ambiguous-research-brief / weak

- totalScore: 35
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 0.85
- needsHumanReview: true
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 6
- graphTargets: pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:bottleneck / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:decomposition / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:delegation / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:verification
- bottlenecks: 초기 요청의 모호성으로 인한 문제 정의 실패, 하위 작업 분해 및 AI에게 배분 실패, AI에게 명확한 지시 및 출력 형식 정의 부족, 검증 계획 및 AI 응답 검증 부재
- axisScores: problem_definition 35 / decomposition 35 / instruction_clarity 35 / adaptation 35 / verification 35 / efficiency 35 / final_quality 35

### ambiguous-research-brief / average

- totalScore: 65
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 1
- needsHumanReview: true
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 9
- graphTargets: pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:verification / pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:decomposition / pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:adaptation / pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:verification
- bottlenecks: 작업 분해가 명확하지 않음, AI 응답 기반 계획 조정 부족, 검증 계획의 구체성 부족, 최종 산출물 요구사항 일부 미충족
- axisScores: problem_definition 85 / decomposition 50 / instruction_clarity 70 / adaptation 40 / verification 60 / efficiency 70 / final_quality 50

### ambiguous-research-brief / strong

- totalScore: 86
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 1
- needsHumanReview: true
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 16
- graphTargets: pair:pair:golden-ambiguous-research-brief-strong-u4:golden-ambiguous-research-brief-strong-a4:bottleneck / pair:pair:golden-ambiguous-research-brief-strong-u1:golden-ambiguous-research-brief-strong-a1:verification / pair:pair:golden-ambiguous-research-brief-strong-u2:golden-ambiguous-research-brief-strong-a2:verification / pair:pair:golden-ambiguous-research-brief-strong-u3:golden-ambiguous-research-brief-strong-a3:verification
- bottlenecks: AI 응답 한계 명시의 구체성 부족, 최종 산출물의 포괄성
- axisScores: problem_definition 96 / decomposition 96 / instruction_clarity 96 / adaptation 96 / verification 80 / efficiency 96 / final_quality 86



