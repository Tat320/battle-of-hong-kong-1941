import assert from 'node:assert/strict';
import test from 'node:test';
import { getHistoricalLayer } from '../src/components/map/historicalLayers.js';

test('maps the December 1941 attack to a red event-impact layer', () => {
  const layer = getHistoricalLayer('attack-1941-12-08');

  assert.equal(layer.category, 'enemy');
  assert.equal(layer.kind, 'impact-zone');
});

test('maps the rescue scenes to green sourced connection paths', () => {
  const layer = getHistoricalLayer('rescue-1942-01-09');

  assert.equal(layer.category, 'rescue');
  assert.equal(layer.kind, 'route');
  assert.equal(layer.path.length, 3);
});

test('maps the sea action to a blue maritime route', () => {
  const layer = getHistoricalLayer('sea-1944-08-15');

  assert.equal(layer.category, 'sea');
  assert.equal(layer.kind, 'route');
  assert.equal(layer.path.at(-1)[1], 22.19);
});
