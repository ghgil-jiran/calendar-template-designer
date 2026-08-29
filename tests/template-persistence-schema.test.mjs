import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../supabase/migrations/202608240001_template_persistence.sql', import.meta.url);
const architectureUrl = new URL('../docs/architecture/06-TEMPLATE-PERSISTENCE.md', import.meta.url);

test('template persistence keeps one library row and separate immutable versions', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  for (const table of ['template_projects', 'template_versions', 'template_drafts', 'template_assets', 'template_version_assets']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(sql, /unique \(template_id, version_number\)/);
  assert.match(sql, /create trigger template_versions_immutable_update/);
  assert.match(sql, /create trigger template_versions_immutable_delete/);
  assert.match(sql, /delete from public\.template_drafts where template_id = v_template\.id/);
});

test('template assets stay private and deduplicate by content hash', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /content_hash text not null unique/);
  assert.match(sql, /'template-assets'/);
  assert.match(sql, /false,/);
  assert.match(sql, /20971520/);
});

test('persistence document records latest-only library behavior', async () => {
  const document = await readFile(architectureUrl, 'utf8');
  assert.match(document, /라이브러리에는 템플릿별 최신본 한 개만 표시/);
  assert.match(document, /자동저장은 버전을 계속 만들지 않고/);
  assert.match(document, /복원하면 과거 기록을 수정하지 않고 새 최신 버전/);
});
