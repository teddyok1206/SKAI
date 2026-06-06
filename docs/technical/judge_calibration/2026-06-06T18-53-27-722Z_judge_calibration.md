# Judge Calibration 2026-06-06T18:53:27.722Z

- status: failed
- baseUrl: http://127.0.0.1:3013
- sampleCount: 3
- judgeModes: llm

## Ordering Checks

- ambiguous-research-brief: fail (weak 35, average 65, strong 86; gaps 30/21; annotations no)


## Results

### ambiguous-research-brief / weak

- totalScore: 35
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 0.85
- needsHumanReview: false
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 0

- bottlenecks: 조사 목표, 범위, 성공 기준이 불명확함, 하위 작업 분해가 이루어지지 않음, AI에게 전달된 지시사항이 모호함, AI 응답 기반의 계획 조정 부족
- axisScores: problem_definition 35 / decomposition 35 / instruction_clarity 35 / adaptation 35 / verification 35 / efficiency 35 / final_quality 35

### ambiguous-research-brief / average

- totalScore: 65
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 1
- needsHumanReview: false
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 6
- graphTargets: pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:verification / pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:framing / pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:delegation / pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:verification
- bottlenecks: 하위 작업 분해가 명확하지 않음, AI 응답 기반의 동적 계획 수정 부족, 최종 산출물 요구사항 일부 미충족
- axisScores: problem_definition 82 / decomposition 66 / instruction_clarity 82 / adaptation 66 / verification 82 / efficiency 70 / final_quality 58

### ambiguous-research-brief / strong

- totalScore: 86
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 1
- needsHumanReview: false
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 15
- graphTargets: pair:pair:golden-ambiguous-research-brief-strong-u1:golden-ambiguous-research-brief-strong-a1:verification / pair:pair:golden-ambiguous-research-brief-strong-u2:golden-ambiguous-research-brief-strong-a2:verification / pair:pair:golden-ambiguous-research-brief-strong-u3:golden-ambiguous-research-brief-strong-a3:verification / pair:pair:golden-ambiguous-research-brief-strong-u3:golden-ambiguous-research-brief-strong-a3:adaptation
- bottlenecks: 검증 계획의 구체성 부족, 최종 산출물의 내용적 깊이 및 완성도
- axisScores: problem_definition 96 / decomposition 96 / instruction_clarity 96 / adaptation 96 / verification 80 / efficiency 96 / final_quality 71



