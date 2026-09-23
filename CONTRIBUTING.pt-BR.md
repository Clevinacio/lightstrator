# Contribuindo

[English](CONTRIBUTING.md) · **Português (Brasil)**

## Antes de qualquer coisa

Leia [`SECURITY.md`](SECURITY.md). Este plugin executa shell na máquina de quem
o instala e injeta instruções no contexto de um agente com permissão de escrita.
Mudanças em `hooks/`, `agents/` e `skills/` são revisadas com esse peso.

Se encontrou uma vulnerabilidade, **não abra PR nem issue** — use o
[private vulnerability reporting](https://github.com/Clevinacio/lightstrator/security/advisories/new).

## Fonte canônica vs. arquivos gerados

Edite à mão apenas:

```
agents/  skills/  hooks/  optional/  docs/  .claude-plugin/  package.json
```

Nunca edite (são reescritos pelo build):

```
AGENTS.md  GEMINI.md  gemini-extension.json  .codex-plugin/  .codex/
.omp-plugin/  omp/
```

Depois de mexer na fonte canônica:

```bash
npm run build     # regera os artefatos dos outros CLIs
npm run check     # falha se algo estiver fora de sincronia
```

Commite os artefatos gerados junto com a mudança — o `/plugin install` lê o
repositório direto, sem passo de build. A CI rejeita PR com artefato
desatualizado.

## O que a CI verifica

- artefatos gerados em dia (`build --check`);
- todo JSON versionado é válido;
- todo `.sh` passa em `bash -n`;
- `hooks/hooks.json` tem a chave de topo `hooks` e todo arquivo referenciado via
  `${CLAUDE_PLUGIN_ROOT}` existe;
- os quatro agentes mantêm a integração com o caveman;
- os gatilhos em português continuam presentes nas `description`;
- todo doc bilíngue tem o par `.md` / `.pt-BR.md`.

## Alterando skills derivadas

`skills/brainstorming/` e `skills/writing-plans/` vêm do
[superpowers](https://github.com/obra/superpowers) (MIT). Toda modificação
precisa ser registrada em [`vendor/superpowers/UPSTREAM.md`](vendor/superpowers/UPSTREAM.md),
com o que mudou e por quê. Não remova os cabeçalhos de atribuição.

## Idioma

Prompts de agentes e skills em inglês. As `description` de `agents/*.md` e de
`skills/orchestrator/SKILL.md` mantêm os verbos-gatilho **nos dois idiomas** —
é o que faz um pedido em português ainda ser roteado para o subagente certo. A
CI falha se um gatilho em português for removido.

Documentação: `README`, `CONTRIBUTING` e `docs/PREREQUISITES` têm par bilíngue
(`.md` em inglês, `.pt-BR.md` em português) e precisam ser atualizados juntos.
`SECURITY.md` e `docs/PORTING.md` são só em inglês.

Mensagens de commit em português, sem marcação de co-autoria de ferramenta, e
com o prefixo Conventional Commits em inglês (`feat:`, `fix:`, `docs:`…) — é
dele que sai a versão do release.

## Pull requests

Um assunto por PR. Descreva o comportamento antes e depois — para mudanças em
prompt, diga qual gatilho passa a disparar ou deixa de disparar, já que não há
teste automatizado que capture isso.

## Releases

Não edite `version` à mão. A cada push na `main`, o
[release-please](https://github.com/googleapis/release-please) mantém aberto um
PR de release com a próxima versão, calculada a partir dos commits desde o
último release:

| Commit | Bump |
| --- | --- |
| `fix:` | patch (`0.2.0` → `0.2.1`) |
| `feat:` | minor (`0.2.0` → `0.3.0`) |
| `feat!:` ou rodapé `BREAKING CHANGE:` | major |
| `docs:`, `chore:`, `ci:`, `refactor:` … | nenhum |

O PR de release sobe o `package.json` e todos os manifestos (`.claude-plugin/`,
`.omp-plugin/`, `.codex-plugin/`, `gemini-extension.json`) e atualiza o
`CHANGELOG.md`; a CI roda nele como em qualquer PR. É o `version` dos manifestos
que o `/plugin update` e o `/marketplace upgrade` comparam, então uma mudança só
chega a quem já instalou depois que o PR de release é mergeado — o que também
cria a tag `vX.Y.Z` e o GitHub Release.

A lista de arquivos versionados fica em `release-please-config.json` — um
manifesto novo precisa entrar lá também. `CHANGELOG.md` e
`.release-please-manifest.json` são mantidos pelo release-please; também não os
edite.
