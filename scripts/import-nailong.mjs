import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage: node scripts/import-nailong.mjs "D:/demo/nailong-art-20/交付_20张"
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const english = JSON.parse(await readFile(join(root, 'docs/nailong/content-en.json'), 'utf8'));
const source = resolve(process.argv[2] ?? '../nailong-art-20/交付_20张');
const records = JSON.parse((await readFile(join(source, '来源记录.json'), 'utf8')).replace(/^\uFEFF/, ''));
records.sort((a, b) => a['编号'] - b['编号']);
if (records.length !== 20 || records.some((r, i) => r['编号'] !== i + 1 || !r['标题'] || !r['简介'])) {
  throw new Error('Expected exactly 20 sequential entries with titles and descriptions.');
}
if (english.length !== records.length || english.some(r => !r.title || !r.description)) throw new Error('English content must cover all source records.');
// Verify the whole delivery before writing any website assets.
for (const record of records) {
  const bytes = await readFile(join(source, record['文件']));
  if (createHash('sha256').update(bytes).digest('hex') !== record.SHA256) {
    throw new Error(`Image checksum mismatch: ${record['文件']}`);
  }
}
await mkdir(join(root, 'public/assets/nailong'), { recursive: true });
await mkdir(join(root, 'docs/nailong'), { recursive: true });
const projects = [];
for (const record of records) {
  const number = String(record['编号']).padStart(2, '0');
  await copyFile(join(source, record['文件']), join(root, `public/assets/nailong/${number}.jpg`));
  projects.push({
    id: `nailong-${number}`, title: english[record['编号'] - 1].title, category: 'Reimagined Classics',
    description: english[record['编号'] - 1].description, cover: `/assets/nailong/${number}.jpg`,
    source: { label: 'Naiwa Art Universe', href: record['网页来源'] }, featured: true,
  });
}
await copyFile(join(source, '来源记录.json'), join(root, 'docs/nailong/来源记录.json'));
const credits = await readFile(join(source, '简介与来源.md'), 'utf8');
await writeFile(join(root, 'docs/nailong/简介与来源.md'), credits.replace(/\(图片\/(\d{2})_[^)]*\.jpg\)/g, '(../../public/assets/nailong/$1.jpg)'));
const contentFile = join(root, 'src/content.ts');
const content = await readFile(contentFile, 'utf8');
const marker = 'export const projects: Project[] =';
const start = content.indexOf(marker);
if (start < 0) throw new Error('Project configuration marker is missing.');
await writeFile(contentFile, `${content.slice(0, start)}${marker} ${JSON.stringify(projects, null, 2)};\n`);
console.log('Imported 20 original JPEGs, titles, descriptions, and source records.');
