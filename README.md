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
/plugin marketplace add clevinacio/lightstrator
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

Dois lembretes injetados a cada prompt: o roteamento do orquestrador (sempre) e
a sequência brainstorming → writing-plans (só em plan mode).

### Opcionais

`optional/statusline-limit.sh` (uso dos limites de 5h e semanal na statusline) e
`optional/rules.md` (regras globais que acompanham o harness).

## Fluxo típico

**Corrigir um bug:** `debugger` acha a causa raiz → correção trivial vai para o
`quick-fixer`, correção com decisão de design fica com o agente principal →
`code-reviewer` revisa antes de fechar.

**Implementar uma feature:** `brainstorming` fecha o design com você →
`writing-plans` escreve o plano → o agente principal implementa com o contexto
que o `investigator` mapeou → `code-reviewer` revisa.

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
