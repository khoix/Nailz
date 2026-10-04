# Multi-Execution Task Planning Convention

## Purpose

Use this convention when a task is too large, risky, or context-heavy to complete reliably in one AI work session.

The convention converts one large task into an ordered sequence of **actionable executions**, where each execution:

- has one coherent objective;
- can reasonably be completed in a single session;
- depends only on work that should already exist;
- ends in a durable, reviewable state;
- records enough handoff context for the next session;
- includes a recommended AI work setting such as **Light, Medium, High, Extra High, or Max** when available.

The goal is to minimize execution context and rediscovery **without sacrificing clarity, correctness, or completion discipline**.

---

## Invocation

Call this convention by name and provide the task.

Example:

> Apply the Multi-Execution Task Planning Convention to this task:
> [task]

Optional inputs may include:

- repository or workspace;
- executing agent name, if already known;
- branch name;
- desired output;
- required tools;
- testing requirements;
- files or systems that must not be changed;
- preferred maximum number of executions.

If no execution count is specified, choose the smallest number of executions that keeps every session independently completable.

## Core Rules

### 1. Split by coherent milestones, not arbitrary size

Each execution should produce a meaningful, testable state.

Good boundaries include:

- foundation / architecture;
- core implementation;
- subsystem integration;
- secondary systems;
- performance / compatibility;
- final integration / validation.

Do **not** split work simply into equal percentages or arbitrary file groups.

### 2. Respect dependency order

Order executions so later work builds on stable earlier work.

Typical dependency order:

1. establish foundation and shared abstractions;
2. implement the core system;
3. integrate major dependent systems;
4. convert remaining secondary systems;
5. stabilize performance, compatibility, and tests;
6. perform final integration and regression repair.

If the task has a different dependency graph, follow the actual prerequisites instead.

### 3. One execution must fit one session

An execution should be small enough that the AI can reasonably:

1. understand the relevant context;
2. make the intended changes;
3. validate them;
4. repair local regressions;
5. save/commit/push or otherwise persist the result;
6. leave a clean handoff.

If any execution contains multiple independent implementation phases, split it again.

### 4. Prefer the fewest executions that are still safe

Do not over-fragment work.

Every extra session creates:

- handoff overhead;
- repeated context;
- more chances for drift;
- more branch/state management.

Split only when doing so materially improves completion reliability, reasoning quality, or reviewability.

### 5. Keep prompts token-lean

Each execution prompt should contain only:

- the execution objective;
- required starting state;
- relevant constraints;
- directly relevant implementation scope;
- validation requirements;
- handoff/persistence requirements.

Do not repeat the full original project brief in every execution.

Instead, store durable cross-session information in a concise handoff file or equivalent persistent note.

---

## AI Work-Setting Selection

Recommend the **lowest setting that can reliably complete the execution**, based on the task’s reasoning complexity, ambiguity, implementation risk, and expected benefit from additional reasoning/verification.

When **GPT-6 Astra** is the executor, use its actual five-level effort scale:

- **Light** (`low`)
- **Medium** (`medium`)
- **High** (`high`)
- **Extra High** (`xhigh`)
- **Max** (`max`)

Do not artificially cap Astra plans at High. Explicitly consider Extra High and Max when the execution is unusually difficult and additional reasoning, iteration, or verification is likely to improve the result. If a different model/agent is being used, use only settings that are actually available for that executor rather than assuming this scale applies.

### Light

Use for low-ambiguity, low-risk work such as:

- mechanical edits;
- formatting;
- simple migrations;
- straightforward asset replacement;
- repetitive changes following an established pattern;
- documentation cleanup;
- simple test additions after architecture is already settled.

Avoid Light when architectural judgment, cross-system reasoning, or difficult debugging is required.

### Medium

Use for normal implementation work such as:

- contained feature development;
- integrating with an existing architecture;
- adapting several related files;
- moderate debugging;
- compatibility work;
- performance cleanup;
- regression repair;
- final validation when the architecture is already established.

Medium should be the default for well-defined implementation work.

### High

Use for work requiring substantial reasoning, such as:

- architecture or foundational design;
- new abstractions used by later executions;
- cross-cutting changes;
- complex rendering/data-flow/state changes;
- difficult debugging;
- uncertain implementation strategy;
- work where an early mistake would propagate into later executions.

Use High selectively. Once the hard architectural decisions are settled, re-evaluate later executions independently rather than assuming they should drop to Medium. Integration, debugging, or final verification can justify High, Extra High, or Max even when the core architecture is already settled.

### Extra High

Use for unusually difficult work where materially more reasoning and verification are likely to improve reliability, for example:

- unusually complex architecture;
- deep multi-system debugging;
- ambiguous problems with several viable technical approaches;
- cross-cutting integration where subtle interactions remain unresolved;
- high-consequence implementation decisions whose mistakes would propagate broadly.

Do not use Extra High simply because an execution is large. If size is the problem, split the execution.

### Max

Use for the hardest **quality-first** executions when additional reasoning, iteration, and verification are worth the extra runtime/usage, for example:

- foundational architecture with multiple credible approaches and broad downstream consequences;
- deep cross-system debugging where the root cause is uncertain and several subsystems interact;
- renderer, compiler, distributed-system, or state-model changes where correctness depends on resolving subtle geometric/data-flow/order interactions;
- final integration work where failures are likely to emerge only through extended testing, repeated diagnosis, and repair;
- tasks that remain exceptionally difficult even after being split into a coherent single-session milestone.

Max is not a substitute for good decomposition. If the execution is merely too broad, split it first. If the resulting coherent execution still has exceptional reasoning or verification demands, Max is appropriate.

---

## Execution Design Procedure

When given a task, perform the following process.

### Step 1 — Identify the final outcome

State what “done” means in concrete terms.

Separate:

- required outcome;
- optional improvements;
- unrelated cleanup.

Optional improvements should not silently become execution requirements.

### Step 2 — Identify invariants and constraints

Extract anything that must remain unchanged, such as:

- existing behavior;
- public APIs;
- game mechanics;
- database schema;
- visual identity;
- compatibility requirements;
- performance characteristics;
- branch policy;
- deployment restrictions.

These become explicit scope guards.

### Step 3 — Identify prerequisite layers

Determine which pieces must exist before others can be implemented.

Typical categories:

- architecture / shared abstraction;
- core implementation;
- dependent subsystems;
- secondary integrations;
- performance / responsive behavior;
- testing / validation;
- final integration.

### Step 4 — Estimate session risk

For each candidate execution, ask:

- Does it require discovering too much context?
- Does it contain more than one major architectural decision?
- Does it span several unrelated subsystems?
- Is validation likely to consume significant time?
- Could the session end before work is persisted?

If yes, split it further.

### Step 5 — Assign work settings

Assign Light, Medium, High, Extra High, or Max using the rubric above.

Evaluate all available levels explicitly; do not default-cap difficult work at High, and do not inflate every execution to Extra High or Max.

### Step 6 — Order executions

Order by dependency, not by convenience.

A later execution should not need to undo or redesign an earlier one unless validation reveals a defect.

### Step 7 — Define completion criteria for every execution

Every execution must specify:

- what must be implemented;
- what must **not** be attempted yet;
- how the result is validated;
- how work is persisted;
- what handoff information is recorded.

---

## Standard Execution Structure

Use the following structure for each execution.

```text
[Task / project name]

This is EXECUTION N of M: [short milestone name].

## Begin

[Load or sync the correct starting state.]

If this is a repository task:
- fetch/pull;
- check the intended branch;
- inspect status/diff/recent history.

Read the persistent handoff note if one exists.

## Objective

[One clear outcome for this execution.]

## Scope

Implement:
- [required item]
- [required item]
- [required item]

Do NOT:
- [future execution work]
- [unrelated cleanup]
- [behavior that must remain unchanged]

## Constraints

[Only constraints directly relevant to this execution.]

## Validation

Verify:
- [specific behavior]
- [specific behavior]

Run:
- [relevant checks/tests]

Repair regressions caused by this execution.

## Handoff

Update the persistent handoff note with:
- what changed;
- architecture/decisions that later work must know;
- important files or systems touched;
- tests/validation completed;
- known limitations;
- exact starting point for the next execution.

Keep the handoff concise.

## Completion

Persist all intended work.

For repository work:
- inspect status/diff;
- commit;
- push;
- verify push succeeded;
- leave the working tree clean.

Do not begin the next execution.

Stop when this milestone is complete.
```

---

## First-Execution Rules

Execution 1 is special.

It must **not** say “continue work” unless implementation already exists.

Execution 1 should:

- establish the working branch/workspace;
- inspect only the context needed to begin;
- create foundational abstractions when required;
- create the persistent handoff file;
- avoid prematurely implementing later layers.

For repository work, create the dedicated branch in Execution 1 unless the user provides an existing branch.

Do not assume which AI agent will execute the work. If an agent name is known, recommend a branch using this schema:

```text
<agent_name>/<project_name>
```

Normalize both components to a concise Git-safe form when practical, for example lowercase/kebab-case. The project component should identify the specific effort rather than merely repeat the repository name when that would be ambiguous.

If the agent name has not been provided, do not invent one. Leave `<agent_name>` as a placeholder or state that the branch prefix should be filled in when the executing agent is chosen.

Once the branch is established, every later execution must reuse that exact branch.

Never overwrite an existing remote branch without inspecting it first.

---

## Continuation-Execution Rules

Executions 2 through N should:

- explicitly load the branch/workspace produced by the prior execution;
- read the handoff note;
- reuse completed work;
- avoid rediscovering or redesigning settled architecture;
- focus only on their assigned milestone.

Use language such as:

> Reuse the completed [system]. Do not recreate it or reopen its design unless a concrete integration defect requires a targeted correction.

---

## Final-Execution Rules

The final execution is primarily an **integration and validation pass**, not another feature/design pass.

It should:

- test major systems together;
- repair regressions caused by the task;
- verify required invariants;
- run the relevant test suite;
- clean stale handoff instructions;
- produce the final summary;
- commit and push;
- open the PR or deliver the final artifact when requested;
- address task-caused CI failures.

The final execution should explicitly prohibit:

- speculative improvements;
- unrelated refactoring;
- re-opening settled design;
- expanding scope after the required outcome is achieved.

---

## Persistent Handoff Convention

When work spans multiple sessions, create one concise handoff file when practical.

Recommended repository path:

```text
docs/AI-HANDOFF.md
```

A task-specific name may be used when multiple concurrent efforts exist:

```text
docs/AI-<TASK>-HANDOFF.md
```

The handoff should contain only information that prevents rediscovery:

```markdown
# Handoff

## Completed
- ...

## Architecture / decisions
- ...

## Important files
- ...

## Validation
- ...

## Known incomplete work
- ...

## Next execution
- ...
```

Do not turn the handoff into a running diary.

Replace stale information as the task progresses.

---

## Repository Persistence Rules

For repository-based tasks, every execution should normally end with:

1. `git status`
2. `git diff --stat`
3. relevant tests/checks
4. commit all intended work
5. push the working branch
6. verify the push succeeded
7. confirm the working tree is clean

The purpose is to make each execution a clean restart point for the next session.

Do not postpone all commits until the final execution.

---

## Non-Repository Tasks

For tasks without Git, replace commit/push with the appropriate durable checkpoint.

Examples:

- save the document/artifact;
- update the shared file;
- write the analysis checkpoint;
- export the generated output;
- update the project handoff note;
- save intermediate data in a persistent workspace.

The same principle applies: every execution must leave a durable state that the next session can resume from.

---

## How to Decide the Number of Executions

Use these heuristics.

### 1 execution

Use when the entire task can be understood, implemented, validated, and persisted comfortably in one session.

### 2–3 executions

Use for moderate tasks with a clear foundation and one or two implementation/integration phases.

Typical pattern:

1. foundation/core;
2. integration;
3. final validation.

### 4–6 executions

Use for substantial cross-system work.

Typical pattern:

1. architecture/foundation;
2. primary implementation;
3. major dependent systems;
4. secondary systems;
5. stabilization;
6. final integration.

### More than 6

Use only when the project genuinely contains many independent milestones.

Before exceeding six, check whether:

- executions are being split too narrowly;
- validation can be combined;
- repetitive work can be grouped;
- one execution is being used merely as a bookkeeping step.

---

## Output Format When Applying This Convention

When asked to break up a task, return:

### 1. Execution plan summary

A compact table:

| Execution | Objective | Setting |
|---|---|---|
| 1 | ... | High |
| 2 | ... | Medium |
| ... | ... | ... |

### 2. Full execution prompts

Provide each execution as a standalone copyable prompt.

Each prompt should be understandable without rereading the entire conversation, but should rely on the handoff note rather than duplicating all prior technical context.

### 3. Setting rationale

Briefly explain setting choices when the level is not obvious, especially Extra High or Max.

Do not add lengthy justification for routine assignments.

---

## Quality Check Before Returning the Plan

Before finalizing, verify:

- Every execution has one coherent milestone.
- No execution depends on work scheduled later.
- Execution 1 correctly establishes the work.
- No specific agent is assumed unless the user supplied one.
- Any recommended Git branch follows `<agent_name>/<project_name>` when the agent is known.
- Continuation executions load and reuse prior state.
- The final execution is integration/validation, not feature expansion.
- Every execution includes persistence/handoff.
- Repository executions commit and push before stopping.
- Work settings reflect reasoning difficulty, ambiguity, and verification needs, not just execution size.
- For Astra, Extra High and Max were explicitly considered where warranted; the plan is not artificially capped at High.
- The prompts are token-lean and do not repeat the full project brief.
- Constraints and invariants are preserved.
- No obvious implementation subsystem has been omitted.
- The number of executions is the minimum needed for reliable completion.

---

## Short Call Form

The convention can be invoked with:

```text
Apply the Multi-Execution Task Planning Convention.

Task:
[task]

Constraints:
[optional constraints]

Repository/workspace:
[optional]

Agent:
[optional; do not infer if omitted]

Preferred branch:
[optional]
```

The resulting plan should automatically determine:

- the number of executions;
- their dependency order;
- the objective of each execution;
- the recommended AI work setting;
- validation requirements;
- handoff requirements;
- persistence/commit/push behavior where applicable.
