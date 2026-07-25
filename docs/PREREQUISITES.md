# Prerequisites

**English** · [Português (Brasil)](PREREQUISITES.pt-BR.md)

Lightstrator does not bundle third-party dependencies. What follows must be
installed separately.

## Required

### caveman

The 4 agents delegate their reply style to the `caveman` skill (level `ultra`),
and `code-reviewer` uses the format of the `/caveman-review` command. That is
what keeps the sub-agents' output compressed — without it, the harness's context
gain drops considerably.

Install it **before** Lightstrator:

```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

Repository: https://github.com/JuliusBrussee/caveman

Other CLIs: caveman ships its own `.codex/` and `GEMINI.md` — follow the
instructions in its repository for your CLI.

> **Without caveman**, the agents still load and work: each one carries a
> fallback block with the compression rules applied directly. It is a degraded
> mode — the output is more verbose than on the supported path.

### jq

Used by the plan-mode hook (`hooks/plan-mode-reminder.sh`) to read
`permission_mode` from the payload.

```bash
sudo apt install jq     # Debian/Ubuntu
brew install jq         # macOS
```

## Optional

### rtk

A CLI proxy that reduces token usage in shell calls (60-90% on typical dev
workflows). Installed externally — see the rtk project.

To enable it, add to your `settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "rtk hook claude" }]
      }
    ]
  }
}
```

Check: `rtk gain` should work. If it fails, you may have
`reachingforthejack/rtk` (Rust Type Kit) installed instead — the names collide.

### Statusline

`optional/statusline-limit.sh` shows the model, the directory and the 5h and
weekly limit usage with time until reset (data from `rate_limits`, available to
Pro/Max subscribers). Requires `jq`.

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash \"${CLAUDE_PLUGIN_ROOT}/optional/statusline-limit.sh\""
  }
}
```

### Global rules

`optional/rules.md` carries two rules that ship with the harness — in
particular, avoiding the `Explore` agent, which competes with routing to
`investigator`.
