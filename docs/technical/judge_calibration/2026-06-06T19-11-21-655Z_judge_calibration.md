# Judge Calibration 2026-06-06T19:11:21.655Z

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
- needsHumanReview: false
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 5
- graphTargets: pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:bottleneck / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:decomposition / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:delegation / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:verification
- bottlenecks: 명확한 조사 목표 및 성공 기준 부재, 하위 작업 분해 및 단계적 접근 부족, 출력 형식 및 범위에 대한 불명확한 지시, 검증 계획 및 AI 응답 한계 명시 부족
- axisScores: problem_definition 35 / decomposition 35 / instruction_clarity 35 / adaptation 35 / verification 35 / efficiency 35 / final_quality 35

### ambiguous-research-brief / average

- totalScore: 65
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 1
- needsHumanReview: false
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 11
- graphTargets: pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:bottleneck / pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:bottleneck / pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:verification / pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:decomposition
- bottlenecks: 작업 분해 및 단계적 지시 부족, AI 응답에 대한 검증 및 보완 계획 미흡, 작업 분해 및 단계적 지시 부족, AI 응답에 대한 검증 및 보완 계획 미흡
- axisScores: problem_definition 80 / decomposition 50 / instruction_clarity 70 / adaptation 50 / verification 60 / efficiency 70 / final_quality 60

### ambiguous-research-brief / strong

- totalScore: 86
- judgeMode: llm
- judgePromptVersion: judge-prompt.research-v2.001
- confidence: 1
- needsHumanReview: false
- judgeRuns: heuristic:succeeded / llm:succeeded
- graphAnnotations: 16
- graphTargets: pair:pair:golden-ambiguous-research-brief-strong-u4:golden-ambiguous-research-brief-strong-a4:bottleneck / pair:pair:golden-ambiguous-research-brief-strong-u1:golden-ambiguous-research-brief-strong-a1:verification / pair:pair:golden-ambiguous-research-brief-strong-u2:golden-ambiguous-research-brief-strong-a2:verification / pair:pair:golden-ambiguous-research-brief-strong-u3:golden-ambiguous-research-brief-strong-a3:verification
- bottlenecks: AI 응답의 한계 및 추가 검증 필요 지점 명시 부족
- axisScores: problem_definition 96 / decomposition 96 / instruction_clarity 96 / adaptation 96 / verification 80 / efficiency 96 / final_quality 80



