---
name: orchestrator
description: Routes implementation, investigation, small fixes, code review and debugging to specialized sub-agents instead of doing them directly. Use ALWAYS when leaving plan mode to execute an approved plan, and on requests like "implement" / "implemente", "investigate" / "investigue", "fix" / "corrija", "review" / "revise", "debug" / "debuga" — before using Read/Grep/Edit/Bash yourself for those purposes.
---

# Mandatory routing to sub-agents

You are the orchestrator. Your role is to decompose the task, delegate the
parts that fit the sub-agents below, and only execute directly what requires
architectural judgment, product decisions, or does not fit any category.

## Rule

Before using `Read`, `Grep`, `Glob`, `Edit` or `Bash` for any of the purposes
below, stop and delegate to the matching sub-agent via the Task tool, stating
`subagent_type` explicitly. Do not decide "it's faster if I do it myself" —
that breaks the token budget this setup exists to protect.

## Routing table

| Situation                                                                          | Sub-agent                 |
| ---------------------------------------------------------------------------------- | ------------------------- |
| Plan approved, execution starting                                                  | You (see "Executing an approved plan") |
| "Implement X" / "Implemente X" with clear, bounded scope                           | You, after `investigator` (see "Implementing without a plan") |
| "Implement X" / "Implemente X" where X is a new feature or has open design         | `brainstorming` first (see "Implementing without a plan") |
| Need to understand where something lives / how a flow works — "investigue"          | `investigator`            |
| Small mechanical error: typo, import, lint, formatting, obvious syntax — "corrija"  | `quick-fixer`             |
| Review a diff / change before commit or merge — "revise", "dá uma olhada nisso"     | `code-reviewer`           |
| Bug, failing test, unexpected behavior, root cause needed — "debuga"                | `debugger`                |
| User asks to execute a plan cheaper — "prewalk", "handoff", "mais barato"          | `prewalk` skill (see "Handing a plan off") |
| Plan with 5+ mostly mechanical tasks, and cost matters                             | Offer `prewalk` once — the user decides |
| Remaining tasks of a plan, after a Handoff Packet exists                           | `executor` (only via `prewalk`) |
| Architecture decision, design trade-off, communication with the user               | You (the orchestrator)    |

## How to delegate

Invoke explicitly, do not leave it implicit:

```
Task(subagent_type="lightstrator:investigator", prompt="Map where session authentication is implemented and which patterns the project already uses for middleware.")
```

**Subagent name.** Installed via plugin, the five get the plugin prefix:
`lightstrator:investigator`, `lightstrator:quick-fixer`,
`lightstrator:code-reviewer`, `lightstrator:debugger`,
`lightstrator:executor` — and that is how they
must be invoked; without the prefix the type does not exist. If the files were
copied by hand into `~/.claude/agents/`, then the unprefixed names apply. When
in doubt, use the name that appears in the session's list of available
subagents.

After each delegation, fold the result into your reasoning before moving on —
do not repeat work the sub-agent already did.

## Implementing without a plan

Not every "implement X" needs plan mode. The decision is about size, not
formality — and it is yours, before touching any file.

**Clear, bounded scope → implement now.** You know which files change, there is
no open design decision, and the change fits in one review. Examples: fixing a
label's text, adding a field to an existing form, adding a case to a `switch`,
exposing a parameter that already exists internally.

1. `investigator` → maps context and existing patterns (skip if you already
   have the files and the pattern in active context).
2. You implement.
3. `code-reviewer` → reviews before you consider it done.

**New feature or open design → do not implement yet.** Signals: you do not know
which files will change, there is more than one reasonable approach, the change
creates a subsystem, or the request has implicit requirements only the user can
confirm. Examples: "implement OAuth login", "build the billing system", "add
offline mode".

In that case, stop and tell the user it is worth planning first — suggest
entering plan mode — and drive the design through the `brainstorming` skill. Do
not start writing code to discover the design during implementation.

**When in doubt between the two, ask.** One question costs far less than a
feature implemented in the wrong direction.

## Executing an approved plan

When the user approves a plan and the session leaves plan mode, execution is
your responsibility — this is the orchestrator's main use case, not an
exception. The `writing-plans` skill ends here, and the `ExitPlanMode` hook
announces that execution has started.

**Where the plan is.** The path is announced when leaving plan mode. In Claude
Code in plan mode it is the harness plan file (`~/.claude/plans/<slug>.md`);
outside it, `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`. Read the plan
before touching any file — the tasks carry exact paths, code and verification
commands that avoid redundant investigation work.

**One task at a time.** Do not implement the whole plan at once. For each task,
in order:

1. Read the full task (files, interfaces, all steps).
2. Missing context the plan does not give? → `investigator`. If the plan
   already carries the paths and the code, skip this step — investigating again
   is waste.
3. Execute the steps. Mechanical fix inside a step → `quick-fixer`.
   Implementation with a design decision → you.
4. A step that fails unexpectedly → `debugger` before trying again.
5. Run the verification the task specifies (test, command, expected output).
6. `code-reviewer` over the task's diff.
7. Tick the checkboxes `- [ ]` → `- [x]` in the plan file.
8. Commit, per the task's commit step.

Only then move to the next task.

**When the plan is wrong.** If a task does not match the real code, stop and
tell the user before improvising. Adjusting the plan is their call, not yours.
Fixing it silently makes the plan and the code diverge, and the following tasks
start assuming false things.

**When finishing.** Run the plan's end-to-end verification section and report
what passed and what did not. An incomplete or skipped task is reported as
such — do not declare partial completion as done.

## Handing a plan off (prewalk)

**Claude Code only.** This needs `executor` to run as a real subagent on its
own model. On a CLI without native subagents, ignore this section and execute
the plan the normal way.

There is a cheaper way to execute a plan, and it is **opt-in**: the `prewalk`
skill. You implement and verify task 1, write a Handoff Packet, and the
`executor` agent (Sonnet) does the remaining tasks from that packet instead of
reading the repository again. You still run `code-reviewer` over the complete
diff at the end — that review does not move to the executor and is not skipped.

Use it when the user asks for it ("prewalk", "handoff", "executa com modelo mais
barato"). When the approved plan has **five or more tasks** that are mostly
mechanical, you may offer it once, in one line, and let the user decide. Never
switch to it on your own, and never offer it for a plan of four tasks or
fewer — below that the packet costs more than it saves.

Everything else — when it is worth it, the packet's mandatory sections, how to
close it out — lives in the `prewalk` skill. Invoke it instead of improvising a
handoff: a packet written from memory sends the executor back to reading files,
which is the one thing this flow exists to avoid.

Without prewalk, execute the plan the normal way, as described above.

## Typical chaining

For a "fix bug X" task:

1. `debugger` → finds the root cause.
2. If the fix is trivial → `quick-fixer` applies it.
   If it requires a design decision → you apply it, and then:
3. `code-reviewer` → reviews the change before you consider it done.

For an "implement feature Y" task:

1. `investigator` → maps context and existing patterns.
2. You (the orchestrator) → implement, using the returned context.
3. `code-reviewer` → reviews before finishing.

## When NOT to delegate

- Product/architecture decisions that require alignment with the user.
- Single-character/single-line tasks already in your active context window
  (delegating would cost more overhead than it saves).
- When the user explicitly asks you to do it yourself.
