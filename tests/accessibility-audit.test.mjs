import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('built accessibility audit rejects missing image alternatives', async () => {
 const root = await mkdtemp(join(tmpdir(), 'image-alt-audit-'));
 try {
  for (const [alt, rejected] of [
   [undefined, true],
   ['', false],
   ['Ein Mitarbeiter bearbeitet ein Karosserieblech.', false],
  ]) {
   await writeFile(join(root, 'index.html'), `<html lang="de"><head><title>Fixture</title></head><body><a class="skip-link" href="#main-content">Skip</a><a class="menu-toggle" href="#site-footer">Menu</a><input type="checkbox" data-system-pointer aria-label="Pointer"><main id="main-content" tabindex="-1"><h1>Handwerk</h1><img ${alt === undefined ? '' : `alt="${alt}"`}></main><footer id="site-footer"></footer></body></html>`);
   const result = spawnSync(process.execPath, ['scripts/audit-accessibility.mjs', root], { encoding: 'utf8' });
   assert.equal(result.status, rejected ? 1 : 0, result.stderr || result.stdout);
   const report = JSON.parse(result.stdout);
   assert.equal(report.failures.length, rejected ? 1 : 0);
  }
 } finally { await rm(root, { recursive: true, force: true }); }
});
