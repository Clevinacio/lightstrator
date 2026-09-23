# Portability across CLIs

Claude Code is the native target: sub-agents, skills and hooks exist as
first-class features. On the other CLIs, part of that does not exist and is
replaced by context instructions. This page describes what survives, what
degrades and how to install on each one.

## Degradation matrix

| Capability | Claude Code | Oh My Pi (omp) | Codex CLI | Gemini / Antigravity |
| --- | --- | --- | --- | --- |
| Sub-agents | native `agents/*.md`, with their own model and tools | native `omp/agents/*.md`, with role models and context isolation | `## Personas` section in `AGENTS.md` — the model takes on the role inline | same, via `GEMINI.md` |
| Skills | native `skills/`, loaded on demand | native `~/.omp/agent/skills/`, loaded on demand | `.codex-plugin/plugin.json` → `"skills": "./skills/"` | `@import` at the top of `GEMINI.md` |
| Orchestrator hook | `hooks/hooks.json`, reads the message from the file | `alwaysApply` rule `omp/rules/lightstrator.md`, injected on every request | `.codex/hooks.json`, message inline in the `echo` | no hooks — becomes fixed text in the context |
| Plan-mode hook | `plan-mode-reminder.sh` reads `permission_mode` | no hook — the `brainstorming`/`writing-plans` triggers and the orchestrator's "Executing an approved plan" section cover it | no plan mode — omitted | omitted |
| Statusline | `optional/statusline-limit.sh` | n/a | n/a | n/a |

What is lost most outside Claude Code is **context isolation**: with real
sub-agents, `investigator` sweeps the codebase in a separate window and returns
only the conclusion. As a persona, the sweep happens in the main context and the
token gain is smaller — caveman's compressed style still applies, but the
structural saving does not.

## Installation per CLI

### Claude Code

```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
/plugin marketplace add Clevinacio/lightstrator
/plugin install lightstrator@lightstrator
```

### Codex CLI

The repository ships `.codex-plugin/plugin.json` (pointing at `skills/`),
`.codex/hooks.json` and `.codex/config.toml` with `hooks = true`. The `AGENTS.md`
at the root loads the skills and the personas.

Install caveman on Codex first (see `PREREQUISITES.md`), then point Codex at
this repository per your version's plugin documentation.

### Gemini CLI / Antigravity

`gemini-extension.json` declares `GEMINI.md` as the context file, and `GEMINI.md`
imports the skills and carries the routing and the personas.

Antigravity reads `AGENTS.md` — same content, generated in the same build.

### Oh My Pi (omp)

omp has native sub-agents with context isolation (via the `task` tool) and
native skills, so nothing degrades into personas. It does not run Claude Code's
shell hooks: the orchestrator message becomes an `alwaysApply` rule instead,
which omp injects in full on every request. The build generates the
omp-specific pieces under `omp/`: the sub-agents (lowercase tools; `haiku` →
role `@smol`, `sonnet`/`opus` → `@task`, `inherit` → no model line, so the
parent's model is used), the orchestrator skill (delegation via the `task`
tool) and the rule.

Install caveman's skills first (see `PREREQUISITES.md`). Then, from a clone of
this repository, install in user scope:

```bash
git clone https://github.com/Clevinacio/lightstrator.git && cd lightstrator

# 1. Sub-agents
mkdir -p ~/.omp/agent/agents
cp omp/agents/*.md ~/.omp/agent/agents/

# 2. Skills (canonical ones, then the omp orchestrator on top)
mkdir -p ~/.omp/agent/skills
cp -r skills/* ~/.omp/agent/skills/
cp omp/skills/orchestrator/SKILL.md ~/.omp/agent/skills/orchestrator/

# 3. Routing rule
mkdir -p ~/.omp/agent/rules
cp omp/rules/lightstrator.md ~/.omp/agent/rules/
```

New sessions pick everything up. Every step is a plain copy, so updating is
`git pull` and running the three steps again. `writing-plans` is installed as
is: it still mentions Claude Code's `ExitPlanMode`, which omp ignores.

## Generated files

Do not edit by hand:

```
AGENTS.md  GEMINI.md  gemini-extension.json
.codex-plugin/plugin.json  .codex/hooks.json  .codex/config.toml
omp/rules/lightstrator.md  omp/skills/orchestrator/SKILL.md  omp/agents/*.md
```

They all come out of `scripts/build.mjs` from the canonical source (`agents/`,
`skills/`, `hooks/messages/`, `.claude-plugin/plugin.json`, `package.json`).
After touching any of those sources:

```bash
npm run build     # rewrites the artifacts
npm run check     # fails if anything is stale (runs in CI)
```

## Adding a new CLI

1. Add the generation function to `scripts/build.mjs` and register the output in
   the object returned by `build()`.
2. If the CLI has no sub-agents, reuse `buildContextFile()` — it already
   assembles imports, routing and personas from the canonical source.
3. If it has no hooks, make sure the text of `hooks/messages/orchestrator.md`
   appears in the context file; that is what keeps the routing active.
4. Run `npm run build && npm run check` and commit the artifacts.
