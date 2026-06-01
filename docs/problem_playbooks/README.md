# Problem Prompt Playbooks

This directory contains founder/operator playbooks for running realistic SKAI demo attempts.

## Purpose

These are not official answers and not user-facing canonical solutions.

They are paste-ready prompt sequences used to:

- run live model smoke tests quickly,
- verify that a problem works under strict cold-start rules,
- create sample attempts for judge calibration,
- help authors check whether a problem naturally elicits orchestration behavior.

## Cold-Start Rule

The live chat model does not receive hidden SKAI problem context. The model only sees:

- prompt text pasted by the user,
- previous visible messages in the attempt trace,
- files/materials explicitly attached by the user.

Therefore the first prompt in each playbook includes the necessary problem situation.

## Format

Each problem playbook should include:

- problem id and recommended solving mode,
- attachment instructions,
- exact prompt blocks in send order,
- optional final-answer field draft,
- smoke-check notes.

When a new problem is added to `data/problems.ts`, add or update the matching playbook in this directory.
