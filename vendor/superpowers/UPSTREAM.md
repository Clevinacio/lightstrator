# Origem das skills derivadas

As skills `brainstorming` e `writing-plans` do Lightstrator são derivadas do
projeto **Superpowers**, redistribuídas sob a licença MIT.

| Campo | Valor |
| --- | --- |
| Projeto | Superpowers |
| Repositório | https://github.com/obra/superpowers |
| Autor | Jesse Vincent (jesse@fsck.com) |
| Licença | MIT — texto integral em [`LICENSE`](./LICENSE) |
| Versão de origem | 6.2.0 |
| Commit de origem | `896224c4b1879920ab573417e68fd51d2ccc9072` |

Arquivos idênticos ao upstream (nenhuma modificação):

- `skills/brainstorming/spec-document-reviewer-prompt.md`
- `skills/brainstorming/scripts/` (todo o diretório)
- `skills/writing-plans/plan-document-reviewer-prompt.md`

## Modificações

### `skills/brainstorming/SKILL.md`

- **`description`** — traduzida para PT-BR e reescrita para disparar ao entrar
  em plan mode, além dos gatilhos originais de trabalho criativo.
- **Passo 6 do checklist e seção "Documentation"** — o spec deixa de ser
  commitado automaticamente; o usuário commita manualmente.
- **Seção "Documentation"** — removida a referência à skill
  `elements-of-style:writing-clearly-and-concisely`, que não faz parte deste
  plugin.
- **Seção "Exploring approaches"** — a linha "YAGNI ruthlessly" saiu daqui e
  passou a integrar a seção "Key Principles".
- **Seção "Key Principles"** — acrescentada (uma pergunta por vez, múltipla
  escolha preferida, YAGNI, explorar alternativas, validação incremental,
  flexibilidade).

### `skills/brainstorming/visual-companion.md`

- Removido o bloco de instruções de inicialização do servidor específico do
  **Gemini CLI** (`--foreground` + `is_background: true`).

### `skills/writing-plans/SKILL.md`

- **`description`** — traduzida para PT-BR e reescrita para disparar em plan
  mode, após o design aprovado pelo `brainstorming`.
- **Seção "Overview"** — removida a referência à skill
  `superpowers:using-git-worktrees`, ausente deste plugin.
- **Cabeçalho do plano** — a linha "For agentic workers" que exigia
  `superpowers:subagent-driven-development` ou `superpowers:executing-plans`
  foi substituída por uma nota simples sobre a sintaxe de checkbox.
- **Seção "Remember"** — acrescentada (caminhos exatos, código completo em
  cada passo, comandos com saída esperada, DRY/YAGNI/TDD/commits frequentes).
- **Seção "Execution Handoff"** — o menu de duas opções de execução
  (subagent-driven vs. inline), que dependia de skills do superpowers não
  incluídas aqui, foi substituído pelo fluxo do Lightstrator: apresentar o
  plano para aprovação (via `ExitPlanMode` em plan mode) e executar
  in-session, delegando as tarefas conforme o roteamento da skill
  `orquestrador`.

## Como conferir

```bash
# Com o superpowers 6.2.0 instalado localmente:
SP=~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills
diff -u $SP/brainstorming/SKILL.md   skills/brainstorming/SKILL.md
diff -u $SP/writing-plans/SKILL.md   skills/writing-plans/SKILL.md
diff -u $SP/brainstorming/visual-companion.md skills/brainstorming/visual-companion.md
```
