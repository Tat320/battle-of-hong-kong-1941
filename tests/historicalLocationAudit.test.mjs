import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const historyUrl = new URL('../src/data/hkHistory.ts', import.meta.url);
const terrainUrl = new URL('../src/components/map/hkTerrainData.ts', import.meta.url);

async function loadData() {
  return {
    history: await readFile(fileURLToPath(historyUrl), 'utf8'),
    terrain: await readFile(fileURLToPath(terrainUrl), 'utf8'),
  };
}

function entry(source, id) {
  return source.match(new RegExp(`id: '${id}',[\\s\\S]*?\\n  },`))?.[0] ?? '';
}

test('rescue scenes name the documented escape routes instead of unrelated districts', async () => {
  const { history, terrain } = await loadData();

  assert.match(entry(history, 'rescue-1942-01-08'), /深水埗、西貢、大鵬灣/);
  assert.match(entry(terrain, 'rescue-1942-01-08'), /label: '深水埗—西貢救援線（代表點）'/);
  assert.match(entry(history, 'rescue-1942-01-09'), /銅鑼灣避風塘、紅磡、梅林坳、深圳白石龍/);
  assert.match(entry(terrain, 'rescue-1942-01-09'), /label: '秘密大營救路線（代表點）'/);
});

test('verified village and ceremony markers use their actual places', async () => {
  const { history, terrain } = await loadData();

  assert.match(entry(terrain, 'founding-1942-02-03'), /coord: \[114\.2951, 22\.4032\]/);
  assert.match(entry(terrain, 'massacre-1942-09-25'), /label: '烏蛟騰村'/);
  assert.match(entry(terrain, 'massacre-1942-09-25'), /coord: \[114\.2435, 22\.5067\]/);
  assert.match(entry(history, 'martyrs-1998-12-28'), /location: '香港大會堂'/);
  assert.match(entry(terrain, 'martyrs-1998-12-28'), /coord: \[114\.1616, 22\.2823\]/);
});

test('city and Kowloon events do not claim unrelated New Territories or Hong Kong Island locations', async () => {
  const { history, terrain } = await loadData();

  assert.match(entry(history, 'station-1942-11'), /location: '九龍市區（具體店址待考）'/);
  assert.match(entry(terrain, 'station-1942-11'), /label: '市區情報站（代表點）'/);
  assert.match(entry(history, 'kerr-1944-02-11'), /九龍觀音山附近/);
  assert.match(entry(terrain, 'kerr-1944-02-11'), /label: '九龍觀音山附近'/);
  assert.match(entry(terrain, 'kerr-1944-02-11'), /coord: \[114\.1995, 22\.3537\]/);
  assert.match(entry(terrain, 'bridge-1944-04-21'), /label: '窩打老道（代表點）'/);
  assert.match(entry(terrain, 'bridge-1944-04-21'), /coord: \[114\.1737, 22\.3161\]/);
});

test('broad events are explicit representative points, while the surrender ceremony uses Government House', async () => {
  const { history, terrain } = await loadData();

  assert.match(entry(terrain, 'reorg-1943-12-02'), /label: '華南—香港聯絡區（代表點）'/);
  assert.match(entry(history, 'sea-1944-08-15'), /location: '港外水域（具體交戰點待考）'/);
  assert.match(entry(terrain, 'sea-1944-08-15'), /label: '港外游擊航道（代表點）'/);
  assert.match(entry(history, 'surrender-1945-09-16'), /location: '香港總督府（今禮賓府）'/);
  assert.match(entry(terrain, 'surrender-1945-09-16'), /coord: \[114\.1575, 22\.2786\]/);
});
