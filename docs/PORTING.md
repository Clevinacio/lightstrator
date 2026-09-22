# Portability across CLIs

Claude Code is the native target: sub-agents, skills and hooks exist as
first-class features. On the other CLIs, part of that does not exist and is
replaced by context instructions. This page describes what survives, what
degrades and how to install on each one.

## Degradation matrix

| Capability | Claude Code | Codex CLI | Gemini / Antigravity |
| --- | --- | --- | --- |
| Sub-agents | native `agents/*.md`, with their own model and tools | `## Personas` section in `AGENTS.md` — the model takes on the role inline | same, via `GEMINI.md` |
| Skills | native `skills/`, loaded on demand | `.codex-plugin/plugin.json` → `"skills": "./skills/"` | `@import` at the top of `GEMINI.md` |
| Orchestrator hook | `hooks/hooks.json`, reads the message from the file | `.codex/hooks.json`, message inline in the `echo` | no hooks — becomes fixed text in the context |
| Plan-mode hook | `plan-mode-reminder.sh` reads `permission_mode` | no plan mode — omitted | omitted |
| Statusline | `optional/statusline-limit.sh` | n/a | n/a |
| `prewalk` handoff | native: `executor` runs as a real subagent on a cheaper model | skill file left out of the `AGENTS.md` imports; the orchestrator's handoff section is still there, gated by its "Claude Code only" guard | same, via `GEMINI.md` |

The `executor` agent and the `prewalk` skill are deliberately **not** generated
into the context files: handing work to a second, cheaper model is the entire
point, and inline there is no second model to hand it to. `scripts/build.mjs`
keeps both exclusions, in `NATIVE_ONLY_AGENTS` and `NATIVE_ONLY_SKILLS`, keyed
on file name so a rename cannot silently re-enable them.

Codex points at the whole `skills/` directory, so `skills/prewalk/SKILL.md` is
still shipped there — its own "Requires native subagents" section is what keeps
it inert. Its `Task(...)` calls never run because the CLI has no such tool.

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

## Generated files

Do not edit by hand:

```
AGENTS.md  GEMINI.md  gemini-extension.json
.codex-plugin/plugin.json  .codex/hooks.json  .codex/config.toml
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
