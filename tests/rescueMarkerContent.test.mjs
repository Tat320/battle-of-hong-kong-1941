import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const terrainDataUrl = new URL('../src/components/map/hkTerrainData.ts', import.meta.url);

test('the 1942-01-09 rescue marker represents a multi-point underground network', async () => {
  const source = await readFile(fileURLToPath(terrainDataUrl), 'utf8');
  const marker = source.match(/id: 'rescue-1942-01-09',[\s\S]*?\n  },/);

  assert.ok(marker, 'the 1942-01-09 map marker must exist');
  assert.match(marker[0], /label: '地下交通網絡'/);
  assert.doesNotMatch(marker[0], /沙田路/);
});
