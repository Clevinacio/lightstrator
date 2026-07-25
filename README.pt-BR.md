# Lightstrator

[English](README.md) · **Português (Brasil)**

Harness de orquestração para agentes de código: em vez de o modelo principal
sair lendo e editando arquivos sozinho, ele roteia o trabalho para subagentes
especializados que respondem comprimido. O contexto principal dura muito mais
numa sessão longa.

Funciona no **Claude Code** (nativo), **Codex CLI** e **Gemini CLI /
Antigravity** (personas + contexto). Os prompts são em inglês, mas os gatilhos
de ativação são bilíngues — pedidos em português continuam sendo roteados, e o
agente responde no idioma em que você escreve.

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
instruções para outros CLIs:
[`docs/PREREQUISITES.pt-BR.md`](docs/PREREQUISITES.pt-BR.md).

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
| `orchestrator` | Tabela de roteamento: qual situação vai para qual subagente, e quando **não** delegar |
| `brainstorming` | Transforma ideia em design por diálogo, uma pergunta por vez, antes de qualquer código |
| `writing-plans` | Escreve o plano de implementação a partir do design aprovado |

### Hooks

Três injeções de contexto: o roteamento do orchestrator (a cada prompt), a
sequência brainstorming → writing-plans (só em plan mode) e o handoff de
execução (ao aprovar um plano, via `PostToolUse` em `ExitPlanMode`).

### Opcionais

`optional/statusline-limit.sh` (uso dos limites de 5h e semanal na statusline) e
`optional/rules.md` (regras globais que acompanham o harness).

## Fluxo principal: plan mode → plano → execução

O caminho para qualquer trabalho não-trivial é sempre o mesmo. Cada seta é
garantida por um hook ou por uma skill, não pela boa vontade do modelo.

```
plan mode ──▶ brainstorming ──▶ writing-plans ──▶ ExitPlanMode ──▶ orchestrator
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

**5. `orchestrator` executa.** Uma task por vez: lê a task, busca contexto
faltante com o `investigator` (ou pula, se o plano já trouxe), implementa,
manda fix mecânico para o `quick-fixer`, chama o `debugger` quando um step
falha de forma inesperada, roda a verificação, passa o `code-reviewer`, marca
o checkbox e commita. Só então vai para a próxima.

Se uma task não bater com o código real, a execução para e te consulta — o
plano não é corrigido em silêncio.

## Gatilhos diretos, sem plan mode

O hook do orchestrator entra em todo prompt, então pedidos diretos também são
roteados — não é preciso planejar para se beneficiar do harness.

| Você diz | O que acontece |
| --- | --- |
| "investigue como funciona X" | `investigator` mapeia e devolve só a conclusão |
| "corrige esse typo / import" | `quick-fixer` aplica |
| "revisa meu diff" | `code-reviewer`, uma linha por achado |
| "esse teste tá falhando" | `debugger` acha a causa raiz antes de qualquer correção |
| "implementa X" (escopo claro) | `investigator` → implementação → `code-reviewer` |
| "implementa X" (feature nova) | para e sugere plan mode + `brainstorming` |

Os gatilhos das `description` são bilíngues de propósito: as mesmas frases
funcionam em inglês (`"fix this typo"`, `"review my diff"`).

A última linha é a regra que evita o pior caso: descobrir o design enquanto
escreve o código. Sinais de que X é grande demais para ir direto — você não sabe
quais arquivos mudam, há mais de uma abordagem razoável, ou o pedido cria um
subsistema. Na dúvida, o orchestrator pergunta em vez de chutar.

**Corrigir um bug, em detalhe:** `debugger` acha a causa raiz → correção trivial
vai para o `quick-fixer`, correção com decisão de design fica com o agente
principal → `code-reviewer` revisa antes de fechar.

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

Ao mexer nas `description` de `agents/*.md` ou de
`skills/orchestrator/SKILL.md`, mantenha os gatilhos nos dois idiomas — o CI
falha se um gatilho em português sumir.

## Créditos e licença

MIT — ver [`LICENSE`](LICENSE).

As skills `brainstorming` e `writing-plans` são derivadas do
[superpowers](https://github.com/obra/superpowers) de Jesse Vincent, também sob
MIT. As modificações estão documentadas em
[`vendor/superpowers/UPSTREAM.md`](vendor/superpowers/UPSTREAM.md), e a
atribuição completa no [`NOTICE`](NOTICE).

O [caveman](https://github.com/JuliusBrussee/caveman) de Julius Brussee é
dependência, não é redistribuído aqui.
