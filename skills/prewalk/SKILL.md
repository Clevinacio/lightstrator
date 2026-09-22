---
name: prewalk
description: Executes an approved plan with a cost handoff — you explore, implement and verify task 1, then hand the rest to the cheaper `executor` agent through a Handoff Packet, and review the complete diff at the end. Opt-in, only on explicit request: "prewalk", "handoff", "execute com modelo mais barato", "executa o resto mais barato", "economiza token nesse plano". Without it, the orchestrator executes the plan normally.
---

<!--
Inspired by prewalk (https://github.com/TerenceLiu98/prewalk) by Terence Liu.
No code reused; the Handoff Packet field set follows the same idea.
-->

# Prewalk: handoff with a packet

## Overview

A plan costs twice when the same repository is read twice — once to plan it,
once to execute it. Prewalk pays that reading **once**, in this session, and
hands the result to a cheaper model as a self-contained packet.

You (the expensive model) explore, plan, implement **task 1** and verify it. The
`executor` agent (Sonnet) receives the **Handoff Packet** and finishes the rest.
The packet, not your raw context, is its context.

**Announce at start:** "I'm using the prewalk skill: task 1 here, the rest goes
to the executor."

## What this is not

Claude Code cannot swap the model of a running session from a plugin. This skill
is **not** the "same session, cheaper model" variant described in some articles —
it is the subagent handoff, which is what a plugin can actually do here.

The consequence matters for how you write the packet: the executor does **not**
inherit your context. Anything it needs that is not in the packet, it will
rediscover by reading files again — at which point the saving is gone. The
packet's quality *is* the saving.

## Requires native subagents

This skill only works where `executor` can run as a real subagent on its own
model — Claude Code. On a CLI without native subagents there is no second model
to hand the packet to, and running the packet inline costs more than executing
the plan directly. There, ignore this skill and execute through `orchestrator`.

## When to use it

Use it when all of these hold:

- The user asked for it. Never start a handoff on your own.
- There is an approved plan, or a task list you can write down as one.
- The plan has **five or more tasks** — four or more remain after task 1.
- The remaining tasks are mostly mechanical: repeating an established pattern,
  wiring, tests that mirror an existing test, docs following a diff.

Do **not** use it when:

- The plan has four tasks or fewer — the packet costs more than it saves. If
  the user asked for prewalk anyway, say that in one line and execute the plan
  normally; do not write a packet to be polite.
- The remaining tasks carry design decisions the plan does not settle.
- The change is security-sensitive, touches auth, migrations or deletes data.
- You could not write the packet without guessing.

When in doubt, execute normally through `orchestrator`. The normal path is never
wrong; prewalk is only ever cheaper.

## The flow

```
you (Opus)                                    executor (Sonnet)
  explore + plan
  task 1: implement + verify
  write the Handoff Packet ───────────────────▶ tasks 2..N
                                                 verify each
  code-reviewer over the COMPLETE diff ◀──────── PREWALK_COMPLETE
  report to the user
```

### 1. Explore and plan

Use `investigator` for the mapping — its output is compressed and becomes the
**Files Read** and **Constraints And Existing Patterns** sections of the packet
almost verbatim. If you are coming out of plan mode, the plan file already
carries this; read it instead of investigating again.

### 2. Task 1, by you

Implement the plan's first task yourself and run its verification. This is not
ceremony: the applied diff becomes the executor's worked example of what correct
looks like in this repository — conventions, imports, test style, commit
message. A packet with a real diff in it beats three paragraphs describing one.

If task 1's verification fails, stop. Do not hand over a broken base.

**One rule changes here.** The normal orchestrator protocol reviews each task
before committing it. Under prewalk the executor commits — where the plan has
commit steps — without a review, and the single full-diff review lands after it
returns. That is intended: do not try to reconcile the two rules mid-run, and do
not ask the executor to review. Whatever the final review raises is fixed
afterwards, as follow-up commits.

### 3. Write the Handoff Packet

Every section is mandatory. An empty section is written as `none`, never
omitted.

````markdown
## Goal

One sentence: what the whole plan builds.

## Plan File

Exact path of the plan file, or `none` if there is no file.

## Files Read

One line per file: `path/to/file.ts:12-88` — what it does and why it matters
here. Include the literal snippet whenever the executor will have to match its
shape.

## Constraints And Existing Patterns

The conventions of this repository that the remaining tasks must follow, with
exact values: naming, error handling, test layout, import style, commit format,
version floors. Copy them verbatim — do not paraphrase a rule into advice.

## Full Todo List

Snapshot only — the plan file is the source of truth for progress.

- [x] Task 1: <name>
- [ ] Task 2: <name>
- [ ] Task N: <name>

## Task 1 Changes

The applied diff, verbatim. This is the executor's worked example.

## Verification Already Run

The exact command and its real output. Example:
`npm run check` → `All generated artifacts are up to date.`

## Remaining Work

For each remaining task: exact files, the steps, the code where the plan gives
code, and the verification command with its expected output. Same level of
detail as the plan — if the plan has it, copy it; do not compress it into a
summary. The executor reads this section instead of the plan.

## Risks / Do Not Repeat

Dead ends already tried, files that must not be touched, traps found while
implementing task 1, anything that will look tempting and is wrong. `none` if
there are none.
````

**Self-check before handing over.** Read the packet as if you had never seen the
repository: could you do task 2 from it alone, without opening a file that
**Files Read** does not already quote? If not, the executor cannot either — fix
the packet, not the executor.

### 4. Hand over

```
Task(subagent_type="lightstrator:executor", prompt="<the complete packet>")
```

One call, the whole packet in the prompt. Do not split the tasks across several
executor calls — each call is a fresh context that pays the packet again.

### 5. Close it out

When the executor returns:

1. Read its report. `PREWALK_INCOMPLETE`, **no marker at all**, a truncated
   return, or any task reported as not done or with a failing verification, is
   **your** problem now. No marker counts as incomplete — never as success.

   Before resuming, re-establish the real state: `git status`, `git diff`, and
   re-run **task 1's** verification command. An executor that stopped mid-task
   can leave half-applied edits, and one that went off the plan can break task 1.
   Take the unfinished tasks back and implement them yourself.
2. Stage everything first, with `git add -A`, so files the executor created are
   visible to a diff at all. Then run `code-reviewer` over the **complete
   diff**, task 1 included. Substitute `<base>` with the real base ref before
   sending:

   ```
   Task(subagent_type="lightstrator:code-reviewer", prompt="Run: git diff <base> — two dots, and everything is already staged. Do not use a bare `git diff` or `git diff <base>...HEAD`: the executor commits only where the plan has a commit step, so part of the work may be committed and part still in the worktree, and neither of those commands sees both. Review that full diff. It was written partly by a smaller model working from a handoff packet — look especially for a pattern from task 1 applied wrongly in later tasks.")
   ```

   This review is not optional and is never delegated to the executor. The
   executor does not review its own diff; the work is only done when this review
   has run.
3. Fix what the review raises — `quick-fixer` for the mechanical findings, you
   for the rest.
4. Report to the user: which tasks the executor did, which you did, what the
   verifications actually returned, and what the review found. An incomplete
   task is reported as incomplete.

## Cost note

The saving comes from the executor **not reopening the repository**, not from
the model being cheaper. A vague packet makes it reread everything and you pay
for the plan twice, with a weaker model. Time spent on the packet is the
cheapest part of this flow.
