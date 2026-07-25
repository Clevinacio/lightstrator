# Lightstrator

**English** · [Português (Brasil)](README.pt-BR.md)

Orchestration harness for coding agents: instead of the main model going off
reading and editing files on its own, it routes the work to specialized
sub-agents that reply compressed. The main context lasts far longer in a long
session.

Works on **Claude Code** (native), **Codex CLI** and **Gemini CLI /
Antigravity** (personas + context). Prompts are in English, but the activation
triggers are bilingual — requests in Portuguese are still routed, and the agent
replies in whichever language you write.

## Installation

The [caveman](https://github.com/JuliusBrussee/caveman) plugin is a **required
prerequisite** — install it first:

```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

Then Lightstrator:

```
/plugin marketplace add Clevinacio/lightstrator
/plugin install lightstrator@lightstrator
```

You also need `jq` on your PATH. Details, optionals (`rtk`, statusline) and
instructions for other CLIs:
[`docs/PREREQUISITES.md`](docs/PREREQUISITES.md).

## What ships in the package

### Sub-agents

| Agent | Model | When it fires |
| --- | --- | --- |
| `investigator` | haiku | Understand where something is implemented or how a flow works, before acting |
| `quick-fixer` | haiku | Small mechanical error: typo, import, lint, formatting, obvious syntax |
| `code-reviewer` | sonnet | Review a diff before commit or merge |
| `debugger` | sonnet | Bug, failing test, unexpected behavior — find the root cause |

They all reply in caveman's compressed style: only the result, no narrating the
process. Code, paths, commands and error messages stay exact.

### Skills

| Skill | Role |
| --- | --- |
| `orchestrator` | Routing table: which situation goes to which sub-agent, and when **not** to delegate |
| `brainstorming` | Turns an idea into a design through dialogue, one question at a time, before any code |
| `writing-plans` | Writes the implementation plan from the approved design |

### Hooks

Three context injections: the orchestrator routing (on every prompt), the
brainstorming → writing-plans sequence (in plan mode only) and the execution
handoff (when a plan is approved, via `PostToolUse` on `ExitPlanMode`).

### Optionals

`optional/statusline-limit.sh` (5h and weekly limit usage in the statusline) and
`optional/rules.md` (global rules that ship with the harness).

## Main flow: plan mode → plan → execution

The path for any non-trivial work is always the same. Every arrow is guaranteed
by a hook or a skill, not by the model's goodwill.

```
plan mode ──▶ brainstorming ──▶ writing-plans ──▶ ExitPlanMode ──▶ orchestrator
   │              │                   │                │               │
   hook       design through      plan with          user           execution
plan-mode      dialogue         tasks and steps    approval        task by task
```

**1. Enter plan mode.** The hook injects the reminder: brainstorming before any
plan.

**2. `brainstorming`.** One question at a time until the design is settled. No
code before your approval.

**3. `writing-plans`.** Writes the plan as small tasks, each with exact files,
code and a verification command. In plan mode the plan goes to the session's
plan file; outside it, to `docs/superpowers/plans/`. The path is announced —
execution starts by reading that file.

**4. You approve** via `ExitPlanMode`. The session drops to auto mode and the
`PostToolUse` hook injects the handoff.

**5. `orchestrator` executes.** One task at a time: reads the task, fetches
missing context with `investigator` (or skips it, if the plan already carried
it), implements, sends mechanical fixes to `quick-fixer`, calls `debugger` when
a step fails unexpectedly, runs the verification, passes it through
`code-reviewer`, ticks the checkbox and commits. Only then does it move on.

If a task does not match the real code, execution stops and asks you — the plan
is not fixed silently.

## Direct triggers, without plan mode

The orchestrator hook enters every prompt, so direct requests are routed too —
you do not need to plan to benefit from the harness.

| You say | What happens |
| --- | --- |
| "investigate how X works" | `investigator` maps it and returns only the conclusion |
| "fix this typo / import" | `quick-fixer` applies it |
| "review my diff" | `code-reviewer`, one line per finding |
| "this test is failing" | `debugger` finds the root cause before any fix |
| "implement X" (clear scope) | `investigator` → implementation → `code-reviewer` |
| "implement X" (new feature) | stops and suggests plan mode + `brainstorming` |

The triggers in the `description` fields are bilingual on purpose: the same
phrases work in Portuguese (`"corrige esse typo"`, `"revisa meu diff"`).

The last row is the rule that avoids the worst case: discovering the design
while writing the code. Signs that X is too big to go straight in — you do not
know which files change, there is more than one reasonable approach, or the
request creates a subsystem. When in doubt, the orchestrator asks instead of
guessing.

**Fixing a bug, in detail:** `debugger` finds the root cause → a trivial fix
goes to `quick-fixer`, a fix with a design decision stays with the main agent →
`code-reviewer` reviews before closing.

## Development

Canonical source (edit by hand): `agents/`, `skills/`, `hooks/`,
`.claude-plugin/`, `package.json`.

Generated by `scripts/build.mjs` (do **not** edit): `AGENTS.md`, `GEMINI.md`,
`gemini-extension.json`, `.codex-plugin/`, `.codex/`.

```bash
npm run build     # regenerates the artifacts for the other CLIs
npm run check     # fails if anything is stale (runs in CI)
```

See [`docs/PORTING.md`](docs/PORTING.md) for the per-CLI degradation matrix and
how to add a new target.

When touching the `description` fields in `agents/*.md` or
`skills/orchestrator/SKILL.md`, keep the triggers in both languages — CI fails
if a Portuguese trigger disappears.

## Credits and license

MIT — see [`LICENSE`](LICENSE).

The `brainstorming` and `writing-plans` skills are derived from
[superpowers](https://github.com/obra/superpowers) by Jesse Vincent, also under
MIT. The modifications are documented in
[`vendor/superpowers/UPSTREAM.md`](vendor/superpowers/UPSTREAM.md), and the full
attribution is in [`NOTICE`](NOTICE).

[caveman](https://github.com/JuliusBrussee/caveman) by Julius Brussee is a
dependency, not redistributed here.
