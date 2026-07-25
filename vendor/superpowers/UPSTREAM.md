# Origin of the derived skills

Lightstrator's `brainstorming` and `writing-plans` skills are derived from the
**Superpowers** project, redistributed under the MIT license.

| Field | Value |
| --- | --- |
| Project | Superpowers |
| Repository | https://github.com/obra/superpowers |
| Author | Jesse Vincent (jesse@fsck.com) |
| License | MIT — full text in [`LICENSE`](./LICENSE) |
| Source version | 6.2.0 |
| Source commit | `896224c4b1879920ab573417e68fd51d2ccc9072` |

Files identical to upstream (no modification):

- `skills/brainstorming/spec-document-reviewer-prompt.md`
- `skills/brainstorming/scripts/` (the whole directory)
- `skills/writing-plans/plan-document-reviewer-prompt.md`

## Modifications

### `skills/brainstorming/SKILL.md`

- **`description`** — rewritten to fire when entering plan mode, on top of the
  original creative-work triggers, and carrying bilingual (English/Portuguese)
  activation triggers.
- **Checklist step 6 and the "Documentation" section** — the spec is no longer
  committed automatically; the user commits manually.
- **"Documentation" section** — removed the reference to the
  `elements-of-style:writing-clearly-and-concisely` skill, which is not part of
  this plugin.
- **"Exploring approaches" section** — the "YAGNI ruthlessly" line moved out of
  here and became part of the "Key Principles" section.
- **"Key Principles" section** — added (one question at a time, multiple choice
  preferred, YAGNI, explore alternatives, incremental validation, flexibility).

### `skills/brainstorming/visual-companion.md`

- Removed the **Gemini CLI**-specific server startup instructions block
  (`--foreground` + `is_background: true`).

### `skills/writing-plans/SKILL.md`

- **`description`** — rewritten to fire in plan mode, after the design approved
  by `brainstorming`, and carrying bilingual (English/Portuguese) activation
  triggers.
- **"Overview" section** — removed the reference to the
  `superpowers:using-git-worktrees` skill, absent from this plugin.
- **Plan header** — the "For agentic workers" line that required
  `superpowers:subagent-driven-development` or `superpowers:executing-plans` was
  replaced by a simple note about the checkbox syntax.
- **"Remember" section** — added (exact paths, complete code in every step,
  commands with expected output, DRY/YAGNI/TDD/frequent commits).
- **"Overview" section — where to save the plan** — the single path
  `docs/superpowers/plans/` became a per-context rule: in plan mode the plan
  goes to the plan file the harness assigned (the only editable file during
  planning), and outside plan mode it stays in `docs/superpowers/plans/`.
  Without this, the skill asked for a path that Claude Code's plan mode does not
  allow writing to, and execution did not know which file to read.
- **"Execution Handoff" section** — the two-option execution menu
  (subagent-driven vs. inline), which depended on superpowers skills not
  included here, was replaced by the Lightstrator flow: announce the plan's
  exact path, present it for approval (via `ExitPlanMode` in plan mode) and hand
  execution over to the `orchestrator` skill, which drives it task by task,
  delegating to the sub-agents. Includes the explicit prohibition against
  implementing straight from this skill or executing the whole plan in one pass.

## How to verify

```bash
# With superpowers 6.2.0 installed locally:
SP=~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills
diff -u $SP/brainstorming/SKILL.md   skills/brainstorming/SKILL.md
diff -u $SP/writing-plans/SKILL.md   skills/writing-plans/SKILL.md
diff -u $SP/brainstorming/visual-companion.md skills/brainstorming/visual-companion.md
```
