import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { projects } from '../src/content.ts';

const records = JSON.parse((await readFile(new URL('../docs/nailong/来源记录.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
const baseURL = process.argv[2];
const english = JSON.parse(await readFile(new URL('../docs/nailong/content-en.json', import.meta.url), 'utf8'));
assert.equal(projects.length, 20);
assert.equal(new Set(projects.map(p => p.id)).size, 20);
for (const record of records) {
  const number = String(record['编号']).padStart(2, '0');
  const project = projects.find(p => p.id === `nailong-${number}`);
  assert.ok(project, `Missing entry ${number}`);
  assert.equal(project.title, english[record['编号'] - 1].title);
  assert.equal(project.description, english[record['编号'] - 1].description);
  assert.equal(project.category, 'Reimagined Classics');
  assert.equal(project.source?.label, 'Naiwa Art Universe');
  assert.ok(!/[\p{Script=Han}]/u.test(JSON.stringify(project)), `Non-English display content ${number}`);
  assert.ok(!('artist' in project), `Unexpected artist credit ${number}`);
  assert.equal(project.featured, true);
  assert.equal(project.source?.href, record['网页来源']);
  const original = await readFile(new URL(`../public${project.cover}`, import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'), record.SHA256);
  if (baseURL) {
    const response = await fetch(new URL(project.cover, baseURL));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /image\/jpeg/);
    const served = Buffer.from(await response.arrayBuffer());
    assert.equal(createHash('sha256').update(served).digest('hex'), record.SHA256);
  }
}
console.log(`Verified 20 titles, descriptions, unique IDs, image hashes${baseURL ? ', and HTTP JPEG responses' : ''}.`);
