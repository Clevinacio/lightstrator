# Security policy

## Risk model

Lightstrator is not an ordinary code package. Once installed, it:

- **runs shell on the user's machine** — `hooks/plan-mode-reminder.sh` runs on
  every prompt sent, and the hooks execute `cat` over plugin files;
- **injects text straight into a coding agent's context** —
  `hooks/messages/*.md`, `agents/*.md` and `skills/**/SKILL.md` are read as
  instructions by a model that has permission to edit files and run commands in
  the user's project.

A malicious change in those paths does not produce a bug: it produces code
execution and agent manipulation on someone else's machine. That is why every PR
goes through maintainer review (`.github/CODEOWNERS`) and CI, and why `main` is
protected against force-push.

Sensitive paths, in order of risk:

| Path | Why |
| --- | --- |
| `hooks/*.sh` | runs on the user's machine |
| `hooks/hooks.json` | defines what is executed and when |
| `hooks/messages/*.md` | goes straight into the agent's context on every prompt |
| `agents/*.md`, `skills/**/SKILL.md` | instruct an agent with write permission |
| `scripts/build.mjs` | runs in CI and on the developer's machine |

## Supported versions

Only the latest version on `main` receives fixes. The plugin does not maintain
release branches.

## How to report

**Do not open a public issue** for a vulnerability. Use the repository's own
[Private vulnerability reporting](https://github.com/Clevinacio/lightstrator/security/advisories/new).

Include: the affected path, what an attacker would gain, and how to reproduce.

Expect a response within 7 days. Since this is a one-person project, there is no
formal SLA.

## Scope

**In scope:** anything in this repository that leads to unintended code
execution, exfiltration of user data, or an instruction capable of leading an
agent to act against the interest of whoever installed it.

**Out of scope:** vulnerabilities in [caveman](https://github.com/JuliusBrussee/caveman),
[superpowers](https://github.com/obra/superpowers), `rtk` or the host CLI
itself — report those in the originating project.
