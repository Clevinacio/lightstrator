# Pré-requisitos

O Lightstrator não empacota dependências de terceiros. O que segue precisa ser
instalado separadamente.

## Obrigatório

### caveman

Os 4 agentes delegam o estilo de resposta à skill `caveman` (nível `ultra`), e
o `code-reviewer` usa o formato do comando `/caveman-review`. É o que mantém o
output dos subagentes comprimido — sem isso, o ganho de contexto do harness cai
bastante.

Instale **antes** do Lightstrator:

```
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

Repositório: https://github.com/JuliusBrussee/caveman

Outros CLIs: o caveman traz `.codex/` e `GEMINI.md` próprios — siga as
instruções do repositório dele para o seu CLI.

> **Sem o caveman**, os agentes ainda carregam e funcionam: cada um traz um
> bloco de fallback com as regras de compressão aplicadas diretamente. É modo
> degradado — o output fica mais verboso que no caminho suportado.

### jq

Usado pelo hook de plan mode (`hooks/plan-mode-reminder.sh`) para ler o
`permission_mode` do payload.

```bash
sudo apt install jq     # Debian/Ubuntu
brew install jq         # macOS
```

## Opcional

### rtk

Proxy de CLI que reduz tokens em operações de shell (60-90% em operações de
desenvolvimento). Instalação externa — ver o projeto do rtk.

Para ativar, acrescente ao seu `settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "rtk hook claude" }]
      }
    ]
  }
}
```

Verificação: `rtk gain` deve funcionar. Se falhar, você pode ter o
`reachingforthejack/rtk` (Rust Type Kit) instalado no lugar — nomes colidem.

### Statusline

`optional/statusline-limit.sh` mostra modelo, diretório e uso dos limites de 5h
e semanal com tempo até resetar (dados de `rate_limits`, disponíveis para
assinantes Pro/Max). Requer `jq`.

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash \"${CLAUDE_PLUGIN_ROOT}/optional/statusline-limit.sh\""
  }
}
```

### Regras globais

`optional/rules.md` traz duas regras que acompanham o harness — em especial
evitar o agente `Explore`, que compete com o roteamento para o `investigator`.
