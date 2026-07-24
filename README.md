# Lightstrator

Harness de orquestração para agentes de código: em vez de o modelo principal
sair lendo e editando arquivos sozinho, ele roteia o trabalho para subagentes
especializados que respondem comprimido. O contexto principal dura muito mais
numa sessão longa.

Funciona no **Claude Code** (nativo), **Codex CLI** e **Gemini CLI /
Antigravity** (personas + contexto). Prompts em Português Brasileiro.

## Instalação

O plugin [caveman](https://github.com/JuliusBrussee/caveman) é **pré-requisito
obrigatório** — instale primeiro:

```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

Depois o Lightstrator:

```
/plugin marketplace add Clevinacio/lightstrator
/plugin install lightstrator@lightstrator
```

Também é preciso ter o `jq` no PATH. Detalhes, opcionais (`rtk`, statusline) e
instruções para outros CLIs: [`docs/PREREQUISITES.md`](docs/PREREQUISITES.md).

## O que vem no pacote

### Subagentes

| Agente | Modelo | Quando dispara |
| --- | --- | --- |
| `investigator` | haiku | Entender onde algo está implementado ou como um fluxo funciona, antes de agir |
| `quick-fixer` | haiku | Erro pequeno e mecânico: typo, import, lint, formatação, sintaxe óbvia |
| `code-reviewer` | sonnet | Revisar um diff antes de commit ou merge |
| `debugger` | sonnet | Bug, teste falhando, comportamento inesperado — achar causa raiz |

Todos respondem no estilo comprimido do caveman: só o resultado, sem narrar
processo. Código, caminhos, comandos e mensagens de erro ficam exatos.

### Skills

| Skill | Papel |
| --- | --- |
| `orquestrador` | Tabela de roteamento: qual situação vai para qual subagente, e quando **não** delegar |
| `brainstorming` | Transforma ideia em design por diálogo, uma pergunta por vez, antes de qualquer código |
| `writing-plans` | Escreve o plano de implementação a partir do design aprovado |

### Hooks

Três injeções de contexto: o roteamento do orquestrador (a cada prompt), a
sequência brainstorming → writing-plans (só em plan mode) e o handoff de
execução (ao aprovar um plano, via `PostToolUse` em `ExitPlanMode`).

### Opcionais

`optional/statusline-limit.sh` (uso dos limites de 5h e semanal na statusline) e
`optional/rules.md` (regras globais que acompanham o harness).

## Fluxo principal: plan mode → plano → execução

O caminho para qualquer trabalho não-trivial é sempre o mesmo. Cada seta é
garantida por um hook ou por uma skill, não pela boa vontade do modelo.

```
plan mode ──▶ brainstorming ──▶ writing-plans ──▶ ExitPlanMode ──▶ orquestrador
   │              │                   │                │               │
   hook       design por          plano com        aprovação        execução
plan-mode      diálogo          tasks e steps      do usuário     task a task
```

**1. Entra em plan mode.** O hook injeta o lembrete: brainstorming antes de
qualquer plano.

**2. `brainstorming`.** Uma pergunta por vez até o design fechar. Nada de
código antes da sua aprovação.

**3. `writing-plans`.** Escreve o plano em tasks pequenas, cada uma com
arquivos exatos, código e comando de verificação. Em plan mode o plano vai para
o plan file da sessão; fora dele, para `docs/superpowers/plans/`. O caminho é
anunciado — a execução começa lendo esse arquivo.

**4. Você aprova** via `ExitPlanMode`. A sessão sai para auto mode e o hook
`PostToolUse` injeta o handoff.

**5. `orquestrador` executa.** Uma task por vez: lê a task, busca contexto
faltante com o `investigator` (ou pula, se o plano já trouxe), implementa,
manda fix mecânico para o `quick-fixer`, chama o `debugger` quando um step
falha de forma inesperada, roda a verificação, passa o `code-reviewer`, marca
o checkbox e commita. Só então vai para a próxima.

Se uma task não bater com o código real, a execução para e te consulta — o
plano não é corrigido em silêncio.

## Outros fluxos

**Corrigir um bug:** `debugger` acha a causa raiz → correção trivial vai para o
`quick-fixer`, correção com decisão de design fica com o agente principal →
`code-reviewer` revisa antes de fechar.

**Tarefa pequena, sem plano:** `investigator` mapeia o contexto → o agente
principal implementa → `code-reviewer` revisa.

## Desenvolvimento

Fonte canônica (edite à mão): `agents/`, `skills/`, `hooks/`,
`.claude-plugin/`, `package.json`.

Gerado por `scripts/build.mjs` (**não** edite): `AGENTS.md`, `GEMINI.md`,
`gemini-extension.json`, `.codex-plugin/`, `.codex/`.

```bash
npm run build     # regera os artefatos dos outros CLIs
npm run check     # falha se algo estiver desatualizado (roda no CI)
```

Ver [`docs/PORTING.md`](docs/PORTING.md) para a matriz de degradação por CLI e
como adicionar um novo alvo.

## Créditos e licença

MIT — ver [`LICENSE`](LICENSE).

As skills `brainstorming` e `writing-plans` são derivadas do
[superpowers](https://github.com/obra/superpowers) de Jesse Vincent, também sob
MIT. As modificações estão documentadas em
[`vendor/superpowers/UPSTREAM.md`](vendor/superpowers/UPSTREAM.md), e a
atribuição completa no [`NOTICE`](NOTICE).

O [caveman](https://github.com/JuliusBrussee/caveman) de Julius Brussee é
dependência, não é redistribuído aqui.
