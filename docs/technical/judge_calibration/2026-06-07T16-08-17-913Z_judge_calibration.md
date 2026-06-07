# Judge Calibration 2026-06-07T16:08:17.913Z

- status: needs_review
- baseUrl: http://127.0.0.1:3000
- sampleCount: 9
- judgeModes: heuristic
- graphTargetHitRate: 1
- lowConfidenceAnchorRate: 0
- duplicateFindingRate: 0

## Ordering Checks

- ambiguous-research-brief: pass (weak 48, average 66, strong 93; gaps 18/27; annotations yes)
- club-budget-workflow: pass (weak 48, average 64, strong 80; gaps 16/16; annotations yes)
- counterfactual-product-review: gap-review (weak 50, average 55, strong 75; gaps 5/20; annotations yes)


## Results

### ambiguous-research-brief / weak

- totalScore: 48
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: true
- judgeRuns: heuristic:succeeded
- graphAnnotations: 2
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:bottleneck / pair:pair:golden-ambiguous-research-brief-weak-u1:golden-ambiguous-research-brief-weak-a1:harness_fit
- bottlenecks: 너무 넓은 지시, 검증 프롬프트 부재
- axisScores: problem_definition 46 / decomposition 45 / instruction_clarity 47 / adaptation 50 / verification 44 / efficiency 62 / final_quality 50

### ambiguous-research-brief / average

- totalScore: 66
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: false
- judgeRuns: heuristic:succeeded
- graphAnnotations: 2
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-ambiguous-research-brief-average-u2:golden-ambiguous-research-brief-average-a2:verification / pair:pair:golden-ambiguous-research-brief-average-u1:golden-ambiguous-research-brief-average-a1:harness_fit
- bottlenecks: none
- axisScores: problem_definition 79 / decomposition 47 / instruction_clarity 80 / adaptation 52 / verification 76 / efficiency 68 / final_quality 62

### ambiguous-research-brief / strong

- totalScore: 93
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: false
- judgeRuns: heuristic:succeeded
- graphAnnotations: 6
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-ambiguous-research-brief-strong-u1:golden-ambiguous-research-brief-strong-a1:verification / pair:pair:golden-ambiguous-research-brief-strong-u2:golden-ambiguous-research-brief-strong-a2:verification / pair:pair:golden-ambiguous-research-brief-strong-u3:golden-ambiguous-research-brief-strong-a3:verification / pair:pair:golden-ambiguous-research-brief-strong-u3:golden-ambiguous-research-brief-strong-a3:adaptation
- bottlenecks: none
- axisScores: problem_definition 100 / decomposition 86 / instruction_clarity 100 / adaptation 89 / verification 100 / efficiency 76 / final_quality 95

### club-budget-workflow / weak

- totalScore: 48
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: true
- judgeRuns: heuristic:succeeded
- graphAnnotations: 6
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:bottleneck / pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:material_grounding / pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:material_grounding / pair:pair:golden-club-budget-workflow-weak-u1:golden-club-budget-workflow-weak-a1:material_grounding
- bottlenecks: 너무 넓은 지시, 검증 프롬프트 부재
- axisScores: problem_definition 46 / decomposition 45 / instruction_clarity 47 / adaptation 50 / verification 40 / efficiency 62 / final_quality 50

### club-budget-workflow / average

- totalScore: 64
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: true
- judgeRuns: heuristic:succeeded
- graphAnnotations: 6
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-club-budget-workflow-average-u2:golden-club-budget-workflow-average-a2:bottleneck / pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:material_grounding / pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:material_grounding / pair:pair:golden-club-budget-workflow-average-u1:golden-club-budget-workflow-average-a1:material_grounding
- bottlenecks: 너무 넓은 지시, 검증 프롬프트 부재
- axisScores: problem_definition 53 / decomposition 59 / instruction_clarity 82 / adaptation 57 / verification 58 / efficiency 66 / final_quality 76

### club-budget-workflow / strong

- totalScore: 80
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: false
- judgeRuns: heuristic:succeeded
- graphAnnotations: 8
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-club-budget-workflow-strong-u1:golden-club-budget-workflow-strong-a1:material_grounding / pair:pair:golden-club-budget-workflow-strong-u1:golden-club-budget-workflow-strong-a1:verification / pair:pair:golden-club-budget-workflow-strong-u2:golden-club-budget-workflow-strong-a2:verification / pair:pair:golden-club-budget-workflow-strong-u4:golden-club-budget-workflow-strong-a4:verification
- bottlenecks: none
- axisScores: problem_definition 68 / decomposition 95 / instruction_clarity 93 / adaptation 61 / verification 96 / efficiency 64 / final_quality 78

### counterfactual-product-review / weak

- totalScore: 50
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: true
- judgeRuns: heuristic:succeeded
- graphAnnotations: 2
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-counterfactual-product-review-weak-u1:golden-counterfactual-product-review-weak-a1:bottleneck / pair:pair:golden-counterfactual-product-review-weak-u1:golden-counterfactual-product-review-weak-a1:harness_fit
- bottlenecks: 너무 넓은 지시, 검증 프롬프트 부재
- axisScores: problem_definition 53 / decomposition 45 / instruction_clarity 47 / adaptation 50 / verification 44 / efficiency 69 / final_quality 50

### counterfactual-product-review / average

- totalScore: 55
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: true
- judgeRuns: heuristic:succeeded
- graphAnnotations: 2
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-counterfactual-product-review-average-u1:golden-counterfactual-product-review-average-a1:bottleneck / pair:pair:golden-counterfactual-product-review-average-u1:golden-counterfactual-product-review-average-a1:harness_fit
- bottlenecks: 너무 넓은 지시, 검증 프롬프트 부재
- axisScores: problem_definition 59 / decomposition 47 / instruction_clarity 49 / adaptation 61 / verification 53 / efficiency 68 / final_quality 56

### counterfactual-product-review / strong

- totalScore: 75
- judgeMode: heuristic
- judgePromptVersion: heuristic-evidence-v1
- confidence: 0.66
- needsHumanReview: false
- judgeRuns: heuristic:succeeded
- graphAnnotations: 4
- graphMetrics: targetHit 1, lowConfidenceAnchor 0, duplicate 0
- graphTargets: pair:pair:golden-counterfactual-product-review-strong-u1:golden-counterfactual-product-review-strong-a1:verification / pair:pair:golden-counterfactual-product-review-strong-u2:golden-counterfactual-product-review-strong-a2:verification / pair:pair:golden-counterfactual-product-review-strong-u3:golden-counterfactual-product-review-strong-a3:verification / pair:pair:golden-counterfactual-product-review-strong-u1:golden-counterfactual-product-review-strong-a1:harness_fit
- bottlenecks: none
- axisScores: problem_definition 66 / decomposition 57 / instruction_clarity 73 / adaptation 68 / verification 100 / efficiency 72 / final_quality 85



