import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(path.join(root, file), 'utf8');
const provenance = JSON.parse(read('source-provenance.json'));
for (const entry of provenance.files) {
  const hash = createHash('sha256').update(readFileSync(path.join(root, entry.path))).digest('hex');
  assert.equal(hash, entry.imported_sha256, `Imported baseline differs: ${entry.path}`);
}
const screens = ['live-control', 'mesh-topology', 'tool-registry', 'acp-telemetry', 'runtime-config-settings'];
let inlineScripts = 0;
for (const screen of screens) {
  const html = read(`dist/${screen}.html`);
  assert.ok(html.includes('id="shared-header"') && html.includes('id="shared-sidebar"'), screen);
  assert.ok(html.includes(`window.currentPage="${screen}"`), screen);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|data:|javascript:)/.test(ref)) continue;
    assert.ok(existsSync(path.join(root, 'dist', ref.split(/[?#]/)[0])), `Missing local reference: ${screen}: ${ref}`);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(match[1])) continue;
    new vm.Script(match[2], {filename: `${screen}.html:inline`});
    inlineScripts++;
  }
  for (const match of html.matchAll(/<input\b[^>]*>/g)) {
    if (/type="password"/.test(match[0])) assert.ok(!/value="[^"]+"/.test(match[0]), 'Nonempty password default');
  }
}
new vm.Script(read('dist/shell.js'), {filename:'shell.js'});
const shell = JSON.parse(read('dist/shell.json'));
assert.ok(shell.header.includes('Hermes Cockpit'));
for (const screen of screens) assert.ok(shell.aside.includes(`data-path="${screen}"`));
assert.ok(read('dist/index.html').includes('url=live-control.html'));
console.log(`PASS: ${provenance.files.length} baseline hashes; ${screens.length} screens; local references; ${inlineScripts} inline scripts and shared shell syntax; blank password defaults.`);
