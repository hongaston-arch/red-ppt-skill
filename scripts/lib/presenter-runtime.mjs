import { readFileSync } from 'node:fs';
import { loadStyles, resource, skillRoot } from './styles.mjs';

export const presenterBlocks = [
  { label: 'presenter CSS', file: 'runtime/presenter.css',
    start: '/* ============ 演讲者模式 ============ */',
    end: '/* ============ /演讲者模式 ============ */' },
  { label: 'presenter JavaScript', file: 'runtime/presenter.js',
    start: '/* =============== 演讲者模式 / 观众屏同步 =============== */',
    end: '/* =============== /演讲者模式 / 观众屏同步 =============== */' },
];

export function locateBlock(text, block, file = 'template') {
  for (const marker of [block.start, block.end]) {
    if (text.split(marker).length !== 2) {
      throw new Error(`${file}: expected exactly one ${block.label} boundary marker: ${marker}`);
    }
  }
  const start = text.indexOf(block.start), end = text.indexOf(block.end);
  if (end < start) throw new Error(`${file}: reversed ${block.label} boundary markers.`);
  return { start, end: end + block.end.length, value: text.slice(start, end + block.end.length) };
}

export function loadPresenterSources(root = skillRoot) {
  return presenterBlocks.map(block => {
    const source = readFileSync(resource(root, block.file), 'utf8');
    const found = locateBlock(source, block, block.file);
    if (found.start !== 0 || source.slice(found.end) !== '\n') {
      throw new Error(`${block.file}: source must contain only its marked block and one final newline.`);
    }
    return { ...block, content: found.value };
  });
}

export function assemblePresenter(template, sources, file = 'template') {
  let result = template;
  for (const block of sources) {
    const found = locateBlock(result, block, file);
    result = result.slice(0, found.start) + block.content + result.slice(found.end);
  }
  return result;
}

// Validate every source and target before the CLI writes any template.
export function planPresenterBuild(root = skillRoot) {
  const sources = loadPresenterSources(root);
  const templates = [...new Set(loadStyles(root).map(style => style.template))];
  return templates.map(file => {
    const path = resource(root, file), before = readFileSync(path, 'utf8');
    return { file, path, before, after: assemblePresenter(before, sources, file) };
  });
}
