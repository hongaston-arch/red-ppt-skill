import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function resource(root, value) {
  if (typeof value !== 'string' || !value || isAbsolute(value) || value.includes('\\') ||
      value.split('/').some(part => !part || part === '.' || part === '..') || /^[a-z]+:/i.test(value)) {
    throw new Error(`Expected a repository-relative file path: ${value}`);
  }
  const base = realpathSync(root);
  const file = realpathSync(resolve(base, value));
  const rel = relative(base, file);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel) || !statSync(file).isFile()) {
    throw new Error(`Resource must be a file inside the skill: ${value}`);
  }
  return file;
}

export function loadStyles(root = skillRoot) {
  const entries = readdirSync(resolve(root, 'styles'), { withFileTypes: true })
    .filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  if (!entries.length) throw new Error('No registered style packages.');
  const ids = new Set();
  return entries.map(entry => {
    const manifest = `styles/${entry.name}/style.json`;
    const style = JSON.parse(readFileSync(resource(root, manifest), 'utf8'));
    if (style.schemaVersion !== 1) throw new Error(`${manifest}: unsupported schemaVersion.`);
    if (typeof style.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(style.id) ||
        style.id !== entry.name || ids.has(style.id)) throw new Error(`${manifest}: invalid or duplicate id.`);
    ids.add(style.id);
    if (typeof style.name !== 'string' || !style.name.trim()) throw new Error(`${manifest}: name is required.`);
    if (!['stable', 'experimental'].includes(style.status)) throw new Error(`${manifest}: invalid status.`);
    if (style.runtime !== 'guizang-presenter-v1') throw new Error(`${manifest}: unsupported runtime.`);
    for (const field of ['template', 'guide', 'layouts', 'themes']) resource(root, style[field]);
    if (!style.template.endsWith('.html')) throw new Error(`${manifest}: template must be HTML.`);
    for (const field of ['rules', 'assets', 'validators']) {
      if (!Array.isArray(style[field])) throw new Error(`${manifest}: ${field} must be an array.`);
      if (new Set(style[field]).size !== style[field].length) throw new Error(`${manifest}: duplicate ${field}.`);
      style[field].forEach(value => resource(root, value));
    }
    for (const file of style.assets) {
      if (!file.startsWith('assets/')) throw new Error(`${manifest}: bundled assets must be under assets/.`);
    }
    for (const file of style.validators) {
      if (!file.startsWith('scripts/') || !file.endsWith('.mjs')) {
        throw new Error(`${manifest}: validators must be Node .mjs scripts under scripts/.`);
      }
    }
    return style;
  });
}

export function getStyle(id, root = skillRoot) {
  const styles = loadStyles(root);
  const style = styles.find(value => value.id === id);
  if (!style) throw new Error(`Unknown style "${id}". Available: ${styles.map(value => value.id).join(', ')}`);
  return style;
}
