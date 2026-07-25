# Contributing

**English** · [Português (Brasil)](CONTRIBUTING.pt-BR.md)

## Before anything else

Read [`SECURITY.md`](SECURITY.md). This plugin runs shell on the machine of
whoever installs it and injects instructions into the context of an agent with
write permission. Changes to `hooks/`, `agents/` and `skills/` are reviewed with
that weight.

If you found a vulnerability, **do not open a PR or an issue** — use
[private vulnerability reporting](https://github.com/Clevinacio/lightstrator/security/advisories/new).

## Canonical source vs. generated files

Edit by hand only:

```
agents/  skills/  hooks/  optional/  docs/  .claude-plugin/  package.json
```

Never edit (they are rewritten by the build):

```
AGENTS.md  GEMINI.md  gemini-extension.json  .codex-plugin/  .codex/
```

After touching the canonical source:

```bash
npm run build     # regenerates the artifacts for the other CLIs
npm run check     # fails if anything is out of sync
```

Commit the generated artifacts along with the change — `/plugin install` reads
the repository directly, with no build step. CI rejects a PR with a stale
artifact.

## What CI checks

- generated artifacts up to date (`build --check`);
- every versioned JSON is valid;
- every `.sh` passes `bash -n`;
- `hooks/hooks.json` has the top-level `hooks` key and every file referenced via
  `${CLAUDE_PLUGIN_ROOT}` exists;
- the four agents keep the caveman integration;
- the Portuguese triggers are still present in the `description` fields;
- every bilingual doc has its `.md` / `.pt-BR.md` pair.

## Changing derived skills

`skills/brainstorming/` and `skills/writing-plans/` come from
[superpowers](https://github.com/obra/superpowers) (MIT). Every modification
must be recorded in [`vendor/superpowers/UPSTREAM.md`](vendor/superpowers/UPSTREAM.md),
with what changed and why. Do not remove the attribution headers.

## Language

Agent and skill prompts are in English. The `description` fields in
`agents/*.md` and `skills/orchestrator/SKILL.md` keep the trigger verbs in
**both languages** — that is what keeps a request written in Portuguese routed
to the right sub-agent. CI fails if a Portuguese trigger is removed.

Documentation: `README`, `CONTRIBUTING` and `docs/PREREQUISITES` have a
bilingual pair (`.md` in English, `.pt-BR.md` in Portuguese) and must be updated
together. `SECURITY.md` and `docs/PORTING.md` are English only.

Commit messages are in Portuguese, with no tool co-authorship marker.

## Pull requests

One subject per PR. Describe the behavior before and after — for prompt changes,
say which trigger starts or stops firing, since there is no automated test that
captures it.
