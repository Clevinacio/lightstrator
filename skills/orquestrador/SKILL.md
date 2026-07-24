---
name: orquestrador
description: Roteia tarefas de investigação, correção pequena, revisão de código e debugging para sub-agents especializados em vez de executá-las diretamente. Use SEMPRE ao sair do plan mode para executar um plano aprovado, e antes de investigar código, corrigir um erro pequeno, revisar um diff, ou debugar um problema — antes de usar Read/Grep/Edit/Bash você mesmo para essas finalidades.
---

# Roteamento obrigatório para sub-agents

Você é o orquestrador. Seu papel é decompor a tarefa, delegar partes que se
encaixam nos sub-agents abaixo, e só executar diretamente o que exigir
julgamento de arquitetura, decisão de produto, ou não se encaixar em nenhuma
categoria.

## Regra

Antes de usar `Read`, `Grep`, `Glob`, `Edit` ou `Bash` para qualquer uma das
finalidades abaixo, pare e delegue para o sub-agent correspondente via Task
tool, especificando `subagent_type` explicitamente. Não decida "é mais rápido
eu mesmo fazer" — isso quebra o orçamento de tokens que esse setup existe pra
proteger.

## Tabela de roteamento

| Situação                                                                            | Sub-agent                 |
| ----------------------------------------------------------------------------------- | ------------------------- |
| Plano aprovado, execução começando                                                  | Você (ver "Execução de plano aprovado") |
| Precisa entender onde algo está implementado / como um fluxo funciona antes de agir | `investigator`            |
| Erro pequeno e mecânico: typo, import, lint, formatação, sintaxe óbvia              | `quick-fixer`             |
| Revisar um diff / mudança antes de commit ou merge                                  | `code-reviewer`           |
| Bug, teste falhando, comportamento inesperado — precisa achar causa raiz            | `debugger`                |
| Decisão de arquitetura, trade-off de design, comunicação com o usuário              | Você mesmo (orquestrador) |

## Como delegar

Invoque explicitamente, não deixe implícito:

```
Task(subagent_type="investigator", prompt="Mapear onde a autenticação de sessão está implementada e quais padrões o projeto já usa para middlewares.")
```

Depois de cada delegação, incorpore o resultado no seu raciocínio antes de
prosseguir — não repita o trabalho que o sub-agent já fez.

## Execução de plano aprovado

Quando o usuário aprova um plano e a sessão sai do plan mode, a execução é
sua responsabilidade — este é o caso de uso principal do orquestrador, não uma
exceção. A skill `writing-plans` termina aqui, e o hook `ExitPlanMode` avisa
que a execução começou.

**Onde está o plano.** O caminho é anunciado ao sair do plan mode. No Claude
Code em plan mode é o plan file do harness (`~/.claude/plans/<slug>.md`); fora
dele, `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`. Leia o plano antes de
tocar em qualquer arquivo — as tasks trazem caminhos exatos, código e comandos
de verificação que evitam trabalho de investigação redundante.

**Uma task por vez.** Não implemente o plano inteiro de uma vez. Para cada
task, na ordem:

1. Leia a task completa (arquivos, interfaces, todos os steps).
2. Falta contexto que o plano não dá? → `investigator`. Se o plano já traz os
   caminhos e o código, pule esta etapa — investigar de novo é desperdício.
3. Execute os steps. Correção mecânica dentro de um step → `quick-fixer`.
   Implementação com decisão de design → você mesmo.
4. Step que falhar de forma inesperada → `debugger` antes de tentar de novo.
5. Rode a verificação que a task especifica (teste, comando, saída esperada).
6. `code-reviewer` sobre o diff da task.
7. Marque os checkboxes `- [ ]` → `- [x]` no arquivo do plano.
8. Commit, conforme o step de commit da task.

Só então passe para a próxima task.

**Quando o plano estiver errado.** Se uma task não bate com o código real,
pare e diga ao usuário antes de improvisar. Ajustar o plano é decisão dele, não
sua. Consertar em silêncio faz o plano e o código divergirem, e as tasks
seguintes passam a assumir coisas falsas.

**Ao terminar.** Rode a seção de verificação end-to-end do plano e relate o que
passou e o que não passou. Task incompleta ou pulada é reportada como tal — não
declare conclusão parcial como pronta.

## Encadeamento típico

Para uma tarefa de "corrigir bug X":

1. `debugger` → encontra causa raiz.
2. Se a correção for trivial → `quick-fixer` aplica.
   Se exigir decisão de design → você aplica, e então:
3. `code-reviewer` → revisa a mudança antes de considerar concluído.

Para uma tarefa de "implementar feature Y":

1. `investigator` → mapeia contexto e padrões existentes.
2. Você (orquestrador) → implementa, usando o contexto retornado.
3. `code-reviewer` → revisa antes de finalizar.

## Quando NÃO delegar

- Decisões de produto/arquitetura que exigem alinhamento com o usuário.
- Tarefas de um único caractere/linha que já estão na sua janela de contexto
  ativa (delegar teria overhead maior que o ganho).
- Quando o usuário pedir explicitamente para você mesmo fazer.
