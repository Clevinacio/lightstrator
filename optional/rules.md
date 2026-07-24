# Regras globais (opcional)

Regras que acompanham o harness mas não são instaladas automaticamente — o
plugin não pode escrever no seu `CLAUDE.md`. Cole no seu `~/.claude/CLAUDE.md`
(ou no `AGENTS.md` do CLI equivalente) as que fizerem sentido.

```markdown
EVITE o uso do agente Explore.

NUNCA adicionar Co-Authored-By, Claude-Session ou qualquer marcação de
co-autoria do Claude nos commits.
```

## Por quê

**Evitar o `Explore`.** O Lightstrator roteia investigação para o
`investigator`, que responde comprimido e devolve bem menos tokens ao contexto
principal. O `Explore` nativo despeja trechos de arquivo e compete com esse
roteamento — sem essa regra, o modelo tende a alternar entre os dois.

**Sem marcação de co-autoria.** Preferência de histórico: os commits saem em
nome de quem está conduzindo o trabalho, sem rodapé de ferramenta.
