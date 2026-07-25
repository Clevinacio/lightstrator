# Portabilidade entre CLIs

O Claude Code é o alvo nativo: subagentes, skills e hooks existem como recursos
de primeira classe. Nos demais CLIs, parte disso não existe e é substituída por
instrução de contexto. Esta página descreve o que sobrevive, o que degrada e
como instalar em cada um.

## Matriz de degradação

| Capacidade | Claude Code | Codex CLI | Gemini / Antigravity |
| --- | --- | --- | --- |
| Subagentes | `agents/*.md` nativo, com modelo e ferramentas próprios | seção `## Personas` em `AGENTS.md` — o modelo assume o papel inline | idem, via `GEMINI.md` |
| Skills | `skills/` nativo, carregadas sob demanda | `.codex-plugin/plugin.json` → `"skills": "./skills/"` | `@import` no topo do `GEMINI.md` |
| Hook do orquestrador | `hooks/hooks.json`, lê a mensagem do arquivo | `.codex/hooks.json`, mensagem inline no `echo` | sem hooks — vira texto fixo no contexto |
| Hook de plan mode | `plan-mode-reminder.sh` lê `permission_mode` | não há plan mode — omitido | omitido |
| Statusline | `optional/statusline-limit.sh` | n/a | n/a |

O que mais se perde fora do Claude Code é o **isolamento de contexto**: com
subagentes reais, o `investigator` varre a base de código numa janela separada
e devolve só a conclusão. Como persona, a varredura acontece no contexto
principal e o ganho de tokens é menor — o estilo comprimido do caveman continua
valendo, mas a economia estrutural não.

## Instalação por CLI

### Claude Code

```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
/plugin marketplace add Clevinacio/lightstrator
/plugin install lightstrator@lightstrator
```

### Codex CLI

O repositório traz `.codex-plugin/plugin.json` (aponta para `skills/`),
`.codex/hooks.json` e `.codex/config.toml` com `hooks = true`. O `AGENTS.md` na
raiz carrega as skills e as personas.

Instale o caveman no Codex primeiro (ver `PREREQUISITES.md`), depois aponte o
Codex para este repositório conforme a documentação de plugins da sua versão.

### Gemini CLI / Antigravity

`gemini-extension.json` declara `GEMINI.md` como arquivo de contexto, e o
`GEMINI.md` importa as skills e traz o roteamento e as personas.

O Antigravity lê `AGENTS.md` — mesmo conteúdo, gerado no mesmo build.

## Arquivos gerados

Não edite à mão:

```
AGENTS.md  GEMINI.md  gemini-extension.json
.codex-plugin/plugin.json  .codex/hooks.json  .codex/config.toml
```

Todos saem de `scripts/build.mjs` a partir da fonte canônica (`agents/`,
`skills/`, `hooks/messages/`, `.claude-plugin/plugin.json`, `package.json`).
Depois de mexer em qualquer uma dessas fontes:

```bash
npm run build     # regrava os artefatos
npm run check     # falha se algo estiver desatualizado (roda no CI)
```

## Adicionando um novo CLI

1. Acrescente a função de geração em `scripts/build.mjs` e registre a saída no
   objeto retornado por `build()`.
2. Se o CLI não tiver subagentes, reaproveite `buildContextFile()` — ela já
   monta imports, roteamento e personas a partir da fonte canônica.
3. Se não tiver hooks, garanta que o texto de `hooks/messages/orchestrator.md`
   apareça no arquivo de contexto; é o que mantém o roteamento ativo.
4. Rode `npm run build && npm run check` e commite os artefatos.
