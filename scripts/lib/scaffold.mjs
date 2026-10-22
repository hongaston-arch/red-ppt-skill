import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { getStyle, resource, skillRoot } from './styles.mjs';

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function scaffold({ styleId, title, output, root = skillRoot }) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('A non-empty --title is required.');
  if (typeof output !== 'string' || !output.trim()) throw new Error('An output directory is required.');
  const style = getStyle(styleId, root);
  const template = readFileSync(resource(root, style.template), 'utf8');
  if ((template.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || []).length !== 1) {
    throw new Error('Template must have exactly one title element.');
  }
  const html = template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
  const target = resolve(output);
  mkdirSync(dirname(target), { recursive: true });
  // Exclusive creation also rejects an existing empty directory or symlink.
  mkdirSync(target);
  mkdirSync(join(target, 'images'));
  for (const asset of style.assets) {
    const destination = join(target, asset);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(resource(root, asset), destination);
  }
  writeFileSync(join(target, 'index.html'), html, { flag: 'wx' });
  writeFileSync(join(target, 'red-deck.json'), `${JSON.stringify({
    schemaVersion: 1, style: style.id, runtime: style.runtime, title,
    template: style.template,
  }, null, 2)}\n`, { flag: 'wx' });
  return { target, style };
}
