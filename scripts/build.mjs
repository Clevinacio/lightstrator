#!/usr/bin/env node
/**
 * Gera os adaptadores dos CLIs não-nativos a partir da fonte canônica.
 *
 * Fonte canônica (editada à mão):
 *   agents/*.md, skills/<nome>/SKILL.md, hooks/messages/*.md,
 *   .claude-plugin/plugin.json, package.json
 *
 * Gerado (NÃO editar à mão):
 *   AGENTS.md, GEMINI.md, gemini-extension.json,
 *   .codex-plugin/plugin.json, .codex/hooks.json, .codex/config.toml
 *   + campo "version" propagado para todos os manifests
 *
 * Uso:
 *   node scripts/build.mjs            grava os arquivos
 *   node scripts/build.mjs --check    só compara; sai com 1 se divergir
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const BANNER = '<!-- GERADO por scripts/build.mjs — não editar à mão -->';

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

/** Extrai os campos de interesse do frontmatter YAML de um arquivo de agente. */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fields = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const start = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (start) {
      key = start[1];
      fields[key] = start[2].trim();
    } else if (key && line.trim()) {
      // valor continuando na linha seguinte
      fields[key] += ' ' + line.trim();
    }
  }
  for (const k of Object.keys(fields)) {
    fields[k] = fields[k].replace(/^["']|["']$/g, '');
  }
  return fields;
}

function readAgents() {
  return readdirSync(join(ROOT, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => ({ file, ...parseFrontmatter(read(join('agents', file))) }));
}

function listSkills() {
  return readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(ROOT, 'skills', d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();
}

const readMessage = (name) => read(join('hooks', 'messages', `${name}.md`)).trim();

/**
 * Arquivo de contexto para CLIs sem subagentes nem (necessariamente) hooks.
 * Serve tanto ao Codex/Antigravity (AGENTS.md) quanto ao Gemini (GEMINI.md).
 */
function buildContextFile({ skills, agents, orquestrador, planApproved }) {
  const imports = skills.map((s) => `@./skills/${s}/SKILL.md`).join('\n');

  const personas = agents
    .map(
      (a) =>
        `### ${a.name}\n\n` +
        `${a.description}\n\n` +
        `Ferramentas: ${a.tools || 'não especificado'}.\n\n` +
        `Este CLI não tem subagentes nativos. Quando a situação acima ocorrer, ` +
        `adote o comportamento descrito em \`agents/${a.file}\` inline, na própria ` +
        `resposta, em vez de delegar.`
    )
    .join('\n\n');

  return `${imports}

# Lightstrator

Harness de orquestração portado para este CLI a partir do plugin nativo do
Claude Code. As skills acima são importadas; o roteamento e as personas abaixo
substituem os recursos que este CLI não tem.

## Pré-requisitos

O plugin **caveman** é obrigatório — os agentes delegam a ele o estilo de
resposta comprimido, e o \`code-reviewer\` usa o formato de \`/caveman-review\`.
Instale-o neste CLI antes do Lightstrator. Ver \`docs/PREREQUISITES.md\`.

## Roteamento obrigatório

${orquestrador}

## Execução de plano aprovado

Este CLI não tem plan mode nem o hook que anuncia a aprovação. Quando um plano
for aprovado pelo usuário — por \`writing-plans\` ou por qualquer outro caminho —
aplique o mesmo protocolo:

${planApproved}

## Personas

Os agentes abaixo existem como subagentes nativos no Claude Code. Aqui eles
são personas: assuma o papel correspondente quando a situação descrita ocorrer.

${personas}

${BANNER}
`;
}

function buildCodexHooks(orquestrador) {
  // O Codex não expande ${CLAUDE_PLUGIN_ROOT}, então a mensagem entra inline.
  // Aspas simples são escapadas para sobreviver ao echo '...' do shell.
  const escaped = orquestrador.replace(/'/g, `'\\''`);
  return {
    hooks: {
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: 'command',
              command: `echo '${escaped}'`,
              timeout: 5,
            },
          ],
        },
      ],
    },
  };
  // O hook de plan mode é omitido: o Codex não tem plan mode.
}

function build() {
  const pkg = readJson('package.json');
  const plugin = readJson('.claude-plugin/plugin.json');
  const marketplace = readJson('.claude-plugin/marketplace.json');
  const { version } = pkg;

  const context = buildContextFile({
    skills: listSkills(),
    agents: readAgents(),
    orquestrador: readMessage('orquestrador'),
    planApproved: readMessage('plan-approved'),
  });

  // Propaga a versão para os manifests canônicos.
  plugin.version = version;
  marketplace.plugins = marketplace.plugins.map((p) =>
    p.name === pkg.name ? { ...p, version } : p
  );

  const codexPlugin = {
    name: plugin.name,
    version,
    description: plugin.description,
    author: plugin.author,
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
    skills: './skills/',
    hooks: {},
  };

  const geminiExtension = {
    name: plugin.name,
    description: plugin.description,
    version,
    contextFileName: 'GEMINI.md',
  };

  const json = (obj) => JSON.stringify(obj, null, 2) + '\n';

  return {
    '.claude-plugin/plugin.json': json(plugin),
    '.claude-plugin/marketplace.json': json(marketplace),
    'AGENTS.md': context,
    'GEMINI.md': context,
    'gemini-extension.json': json(geminiExtension),
    '.codex-plugin/plugin.json': json(codexPlugin),
    '.codex/hooks.json': json(buildCodexHooks(readMessage('orquestrador'))),
    '.codex/config.toml': '[features]\nhooks = true\n',
  };
}

const outputs = build();
const stale = [];

for (const [rel, content] of Object.entries(outputs)) {
  const path = join(ROOT, rel);
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === content) continue;

  if (CHECK) {
    stale.push(rel);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    console.log(`escrito: ${rel}`);
  }
}

if (CHECK) {
  if (stale.length) {
    console.error('Artefatos desatualizados:\n  ' + stale.join('\n  '));
    console.error('\nRode `npm run build` e commite o resultado.');
    process.exit(1);
  }
  console.log('Todos os artefatos gerados estão em dia.');
} else if (!Object.keys(outputs).length) {
  console.log('nada a fazer');
}
