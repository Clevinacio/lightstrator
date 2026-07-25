# Global rules (optional)

Rules that ship with the harness but are not installed automatically — the
plugin cannot write to your `CLAUDE.md`. Paste whichever make sense into your
`~/.claude/CLAUDE.md` (or the equivalent CLI's `AGENTS.md`).

```markdown
AVOID using the Explore agent.

NEVER add Co-Authored-By, Claude-Session or any Claude co-authorship marker to
commits.
```

## Why

**Avoiding `Explore`.** Lightstrator routes investigation to the
`investigator`, which replies compressed and returns far fewer tokens to the
main context. The native `Explore` dumps file excerpts and competes with that
routing — without this rule, the model tends to alternate between the two.

**No co-authorship marker.** History preference: commits go out under the name
of whoever is driving the work, with no tool footer.
