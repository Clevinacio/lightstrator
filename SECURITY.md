# Política de segurança

## Modelo de risco

O Lightstrator não é um pacote de código comum. Ao ser instalado, ele:

- **executa shell na máquina do usuário** — `hooks/plan-mode-reminder.sh` roda a
  cada prompt enviado, e os hooks executam `cat` sobre arquivos do plugin;
- **injeta texto direto no contexto de um agente de código** —
  `hooks/messages/*.md`, `agents/*.md` e `skills/**/SKILL.md` são lidos como
  instrução por um modelo que tem permissão de editar arquivos e rodar comandos
  no projeto do usuário.

Uma alteração maliciosa nesses caminhos não produz um bug: produz execução de
código e manipulação de agente na máquina de terceiros. É por isso que todo PR
passa por revisão do mantenedor (`.github/CODEOWNERS`) e pela CI, e que a
`main` é protegida contra force-push.

Caminhos sensíveis, em ordem de risco:

| Caminho | Por quê |
| --- | --- |
| `hooks/*.sh` | executa na máquina do usuário |
| `hooks/hooks.json` | define o que é executado e quando |
| `hooks/messages/*.md` | vai direto para o contexto do agente a cada prompt |
| `agents/*.md`, `skills/**/SKILL.md` | instruem um agente com permissão de escrita |
| `scripts/build.mjs` | roda na CI e na máquina de quem desenvolve |

## Versões suportadas

Só a versão mais recente da `main` recebe correções. O plugin não mantém
branches de release.

## Como reportar

**Não abra issue pública** para vulnerabilidade. Use o
[Private vulnerability reporting](https://github.com/Clevinacio/lightstrator/security/advisories/new)
do próprio repositório.

Inclua: o caminho afetado, o que um atacante conseguiria, e como reproduzir.

Resposta esperada em até 7 dias. Como é um projeto mantido por uma pessoa só,
não há SLA formal.

## Escopo

**Dentro do escopo:** qualquer coisa neste repositório que leve a execução de
código não pretendida, exfiltração de dados do usuário, ou instrução capaz de
levar um agente a agir contra o interesse de quem instalou.

**Fora do escopo:** vulnerabilidades no [caveman](https://github.com/JuliusBrussee/caveman),
no [superpowers](https://github.com/obra/superpowers), no `rtk` ou no próprio
CLI hospedeiro — reporte no projeto de origem.
