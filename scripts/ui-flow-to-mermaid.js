#!/usr/bin/env node
/**
 * Read docs/ui-flow.seed.json and emit Mermaid diagrams (one file per diagram layer).
 *
 * Usage:
 *   node scripts/ui-flow-to-mermaid.js              # write all layers to docs/diagrams/
 *   node scripts/ui-flow-to-mermaid.js --list       # list layer ids
 *   node scripts/ui-flow-to-mermaid.js --layer layer-top-level
 *   node scripts/ui-flow-to-mermaid.js --stdout --layer layer-cross-role
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_SEED = join(ROOT, "docs", "ui-flow.seed.json");
const DEFAULT_OUT = join(ROOT, "docs", "diagrams");

const EDGE_ARROWS = {
  click: "-->",
  "deep-link": "-->",
  auto: "-.->",
  programmatic: "-.->",
  "storage-sync": "==>",
};

function parseArgs(argv) {
  const opts = { seed: DEFAULT_SEED, out: DEFAULT_OUT, layers: null, stdout: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--list") opts.list = true;
    else if (arg === "--stdout") opts.stdout = true;
    else if (arg === "--seed") opts.seed = resolve(argv[++i]);
    else if (arg === "--out") opts.out = resolve(argv[++i]);
    else if (arg === "--layer") {
      if (!opts.layers) opts.layers = [];
      opts.layers.push(argv[++i]);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`Usage: node scripts/ui-flow-to-mermaid.js [options]

Options:
  --list              List diagram layer ids from the seed file
  --layer <id>        Generate only this layer (repeatable)
  --out <dir>         Output directory (default: docs/diagrams)
  --seed <path>       Path to ui-flow.seed.json
  --stdout            Print to stdout instead of writing files
  -h, --help          Show this help
`);
}

function loadSeed(path) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw);
}

function mermaidId(id) {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeLabel(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "#quot;")
    .replace(/\[/g, "#91;")
    .replace(/\]/g, "#93;")
    .replace(/\n/g, " ")
    .replace(/\|/g, "#124;");
}

function shortLabel(node) {
  if (!node) return "?";
  const label = node.label || node.id;
  const cut = label.split("·")[0].trim();
  return cut.length > 48 ? `${cut.slice(0, 45)}…` : cut;
}

function buildNodeMap(nodes) {
  return new Map(nodes.map((n) => [n.id, n]));
}

function collectLayerNodeIds(layer, nodeMap) {
  if (layer.syncLinkIds) return new Set();
  return new Set(layer.nodeIds.filter((id) => nodeMap.has(id)));
}

function edgesForLayer(nodeIds, edges) {
  const expanded = new Set(nodeIds);
  for (const edge of edges) {
    if (nodeIds.has(edge.from) || nodeIds.has(edge.to)) {
      expanded.add(edge.from);
      expanded.add(edge.to);
    }
  }
  return edges.filter(
    (e) => expanded.has(e.from) && expanded.has(e.to) && e.from !== e.to,
  );
}

function arrowFor(triggerType) {
  return EDGE_ARROWS[triggerType] || "-->";
}

function renderFlowchart(title, nodeIds, edges, nodeMap) {
  const lines = ["flowchart TD"];
  lines.push(`  %% ${title}`);

  const ids = new Set(nodeIds);
  for (const edge of edges) {
    ids.add(edge.from);
    ids.add(edge.to);
  }

  for (const id of ids) {
    const node = nodeMap.get(id);
    const label = escapeLabel(node ? shortLabel(node) : id);
    const mid = mermaidId(id);
    const shape =
      node?.type === "gate"
        ? `${mid}{{"${label}"}}`
        : node?.type === "modal" || node?.type === "overlay"
          ? `${mid}(["${label}"])`
          : `${mid}["${label}"]`;
    lines.push(`  ${shape}`);
  }

  for (const edge of edges) {
    const from = mermaidId(edge.from);
    const to = mermaidId(edge.to);
    const trigger = escapeLabel(edge.trigger);
    const arrow = arrowFor(edge.triggerType);
    lines.push(`  ${from} ${arrow}|"${trigger}"| ${to}`);
  }

  return lines.join("\n");
}

function renderStateDiagram(title, nodeIds, edges, nodeMap, layerId) {
  const lines = ["stateDiagram-v2"];
  lines.push(`  %% ${title}`);

  const stateIds = [...nodeIds].filter((id) => nodeMap.has(id));
  const idToState = new Map();
  for (const id of stateIds) {
    idToState.set(id, mermaidId(id));
  }

  if (layerId !== "layer-facilitator-boards") {
    for (const id of stateIds) {
      const stateName = idToState.get(id);
      const node = nodeMap.get(id);
      const label = escapeLabel(shortLabel(node));
      if (label !== stateName) {
        lines.push(`  ${stateName}: ${label}`);
      }
    }
  }

  if (layerId === "layer-facilitator-boards") {
    const nested = new Set(["fac-board-empathy-grid", "fac-board-empathy-focus"]);
    const boardOrder = [
      "fac-board-empathy",
      "fac-board-parking",
      "fac-board-reflections",
      "fac-board-practices",
      "fac-board-commitments",
    ].filter((id) => idToState.has(id));

    for (const id of stateIds) {
      if (nested.has(id) || id === "fac-board-empathy") continue;
      const stateName = idToState.get(id);
      const node = nodeMap.get(id);
      const label = escapeLabel(shortLabel(node));
      if (label !== stateName) {
        lines.push(`  ${stateName}: ${label}`);
      }
    }

    if (boardOrder.length > 0) {
      lines.push(`  [*] --> ${idToState.get(boardOrder[0])}`);
      for (let i = 1; i < boardOrder.length; i++) {
        const prev = boardOrder[i - 1];
        const curr = boardOrder[i];
        const node = nodeMap.get(curr);
        const trigger = escapeLabel((node?.label || curr).split("·")[0].trim());
        lines.push(`  ${idToState.get(prev)} --> ${idToState.get(curr)}: ${trigger}`);
      }
    }

    const empathy = idToState.get("fac-board-empathy");
    const grid = idToState.get("fac-board-empathy-grid");
    const focus = idToState.get("fac-board-empathy-focus");
    if (empathy && grid && focus) {
      const empathyLabel = escapeLabel(shortLabel(nodeMap.get("fac-board-empathy")));
      lines.push(`  state "${empathyLabel}" as ${empathy} {`);
      lines.push(`    [*] --> ${grid}`);
      lines.push(`    ${grid} --> ${focus}: Focus (1)`);
      lines.push(`    ${focus} --> ${grid}: Gallery (8)`);
      lines.push("  }");
    }

    return lines.join("\n");
  }

  const layerEdges = edges.filter(
    (e) => idToState.has(e.from) && idToState.has(e.to) && e.from !== e.to,
  );

  if (layerEdges.length === 0) {
    const shellToBoard = edges.filter(
      (e) => e.from === "facilitator-shell" && idToState.has(e.to),
    );
    if (shellToBoard.length > 0) {
      lines.push(`  [*] --> ${idToState.get(shellToBoard[0].to)}`);
      for (let i = 1; i < shellToBoard.length; i++) {
        const prev = shellToBoard[i - 1];
        const curr = shellToBoard[i];
        const trigger = escapeLabel(curr.trigger.replace(/^Board tab · /, ""));
        lines.push(
          `  ${idToState.get(prev.to)} --> ${idToState.get(curr.to)}: ${trigger}`,
        );
      }
    } else if (stateIds.length > 0) {
      lines.push(`  [*] --> ${idToState.get(stateIds[0])}`);
    }
  } else {
    const roots = stateIds.filter((id) => !layerEdges.some((e) => e.to === id));
    for (const root of roots.length ? roots : [stateIds[0]]) {
      lines.push(`  [*] --> ${idToState.get(root)}`);
    }
    for (const edge of layerEdges) {
      const from = idToState.get(edge.from);
      const to = idToState.get(edge.to);
      const trigger = escapeLabel(edge.trigger);
      lines.push(`  ${from} --> ${to}: ${trigger}`);
    }
  }

  return lines.join("\n");
}

function renderSequenceDiagram(title, syncLinks) {
  const lines = ["sequenceDiagram"];
  lines.push(`  %% ${title}`);

  const actorNames = {
    facilitator: "Facilitator",
    participant: "Participant",
    storage: "Storage",
  };

  for (const link of syncLinks) {
    lines.push(`  %% ${link.id}: ${link.effect}`);
    const driver = actorNames[link.driver] || link.driver;
    const follower = actorNames[link.follower] || link.follower;

    if (link.driver === link.follower) {
      lines.push(`  participant ${driver}`);
      const key = link.storageKey || (link.storageKeys && link.storageKeys[0]) || link.id;
      lines.push(`  ${driver}->>${driver}: ${escapeLabel(link.mechanism)} (${key})`);
      continue;
    }

    lines.push(`  participant ${driver}`);
    lines.push(`  participant Storage`);
    lines.push(`  participant ${follower}`);

    const key = link.storageKey || (link.storageKeys && link.storageKeys.join(", ")) || link.id;
    if (link.direction === "facilitator-to-participant") {
      lines.push(`  ${driver}->>Storage: set ${key}`);
      lines.push(`  ${follower}->>Storage: poll`);
      lines.push(`  Storage-->>${follower}: ${escapeLabel(link.effect)}`);
    } else if (link.direction === "participant-to-facilitator") {
      lines.push(`  ${driver}->>Storage: append ${key}`);
      lines.push(`  ${follower}->>Storage: poll`);
      lines.push(`  Storage-->>${follower}: ${escapeLabel(link.effect)}`);
    } else {
      lines.push(`  Note over ${driver},${follower}: ${escapeLabel(link.mechanism)}`);
      lines.push(`  ${follower}->>Storage: read ${key}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function renderLayer(layer, seed, nodeMap) {
  const { recommendedDiagram } = layer;

  if (recommendedDiagram === "sequenceDiagram") {
    const links = (layer.syncLinkIds || [])
      .map((id) => seed.syncLinks.find((l) => l.id === id))
      .filter(Boolean);
    return renderSequenceDiagram(layer.title, links);
  }

  const nodeIds = collectLayerNodeIds(layer, nodeMap);
  const edges = edgesForLayer(nodeIds, seed.edges);

  if (recommendedDiagram === "stateDiagram") {
    return renderStateDiagram(layer.title, nodeIds, edges, nodeMap, layer.id);
  }

  return renderFlowchart(layer.title, nodeIds, edges, nodeMap);
}

function renderOverview(seed, nodeMap) {
  const topLayer = seed.diagramLayers.find((l) => l.id === "layer-top-level");
  const urlLayer = seed.diagramLayers.find((l) => l.id === "layer-url");
  const nodeIds = new Set([
    ...(urlLayer?.nodeIds || []),
    ...(topLayer?.nodeIds || []),
  ]);
  const edges = seed.edges.filter((e) => {
    if (e.from === "fac-qr-panel" && e.to === "participant-shell") return false;
    return nodeIds.has(e.from) || nodeIds.has(e.to);
  });
  const filtered = edgesForLayer(nodeIds, edges);

  const lines = ["flowchart TD", "  %% Overview: entry points and role shells"];
  for (const ep of seed.entryPoints) {
    if (!ep.resolvesTo && ep.id !== "ep-room") continue;
    const epId = mermaidId(ep.id);
    const pathLabel =
      ep.query && ep.query.role
        ? `${ep.path}?role=${ep.query.role}`
        : ep.path;
    lines.push(`  ${epId}["${escapeLabel(pathLabel)}"]`);
    if (ep.resolvesTo) {
      lines.push(`  ${epId} --> ${mermaidId(ep.resolvesTo)}`);
    }
  }

  const ids = new Set(nodeIds);
  for (const edge of filtered) {
    ids.add(edge.from);
    ids.add(edge.to);
  }

  for (const id of ids) {
    const node = nodeMap.get(id);
    const label = escapeLabel(node ? shortLabel(node) : id);
    const mid = mermaidId(id);
    const shape =
      node?.type === "gate"
        ? `${mid}{{"${label}"}}`
        : node?.type === "modal" || node?.type === "overlay"
          ? `${mid}(["${label}"])`
          : `${mid}["${label}"]`;
    lines.push(`  ${shape}`);
  }

  for (const edge of filtered) {
    const from = mermaidId(edge.from);
    const to = mermaidId(edge.to);
    const trigger = escapeLabel(edge.trigger);
    const arrow = arrowFor(edge.triggerType);
    lines.push(`  ${from} ${arrow}|"${trigger}"| ${to}`);
  }

  return lines.join("\n");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const seed = loadSeed(opts.seed);
  const nodeMap = buildNodeMap(seed.nodes);

  if (opts.list) {
    for (const layer of seed.diagramLayers) {
      console.log(`${layer.id}\t${layer.title}\t${layer.recommendedDiagram}`);
    }
    return;
  }

  const layers = opts.layers
    ? seed.diagramLayers.filter((l) => opts.layers.includes(l.id))
    : seed.diagramLayers;

  if (opts.layers && layers.length !== opts.layers.length) {
    const found = new Set(layers.map((l) => l.id));
    const missing = opts.layers.filter((id) => !found.has(id));
    console.error(`Unknown layer id(s): ${missing.join(", ")}`);
    process.exit(1);
  }

  const outputs = [
    ...(opts.layers
      ? []
      : [{ name: "overview", content: renderOverview(seed, nodeMap) }]),
    ...layers.map((layer) => ({
      name: layer.id,
      content: renderLayer(layer, seed, nodeMap),
    })),
  ];

  if (opts.stdout) {
    for (const { name, content } of outputs) {
      console.log(`--- ${name} ---\n${content}\n`);
    }
    return;
  }

  mkdirSync(opts.out, { recursive: true });

  const indexLines = [
    `# ${seed.meta.app} — UI flow diagrams`,
    "",
    `Generated from \`docs/ui-flow.seed.json\` by \`scripts/ui-flow-to-mermaid.js\`.`,
    "",
    "Re-generate: `npm run diagrams`",
    "",
  ];

  for (const { name, content } of outputs) {
    const file = `${name}.mmd`;
    const path = join(opts.out, file);
    writeFileSync(path, `${content}\n`, "utf8");
    indexLines.push(`## ${name}`, "", "```mermaid", content, "```", "");
    console.log(`Wrote ${path}`);
  }

  writeFileSync(join(opts.out, "README.md"), indexLines.join("\n"), "utf8");
  console.log(`Wrote ${join(opts.out, "README.md")}`);
}

main();
