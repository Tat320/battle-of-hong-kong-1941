import assert from 'node:assert/strict';
import test from 'node:test';
import { getCameraShot } from '../src/components/map/cameraDirector.js';

test('uses a zoomed-out distance multiplier for every guided camera shot', () => {
  for (let index = 0; index < 9; index += 1) {
    assert.ok(getCameraShot(index).distanceMultiplier >= 1.28);
  }
});

test('cycles through distinct viewing angles instead of reusing one fixed angle', () => {
  const angles = new Set([0, 1, 2].map((index) => getCameraShot(index).yaw));

  assert.equal(angles.size, 3);
});

test('repeats the shot sequence predictably for later historical scenes', () => {
  assert.deepEqual(getCameraShot(0), getCameraShot(3));
});
