import assert from 'node:assert/strict';
import test from 'node:test';
import { createStoryTransition } from '../src/components/map/storyNavigation.js';

test('shows only the selected marker when the story starts', () => {
  const transition = createStoryTransition(['a', 'b', 'c'], '', 'b');

  assert.deepEqual(transition, {
    activeId: 'b',
    departingId: undefined,
    visibleIds: ['b'],
    hasRoute: false,
  });
});

test('keeps only the departing and arriving markers visible during a scene change', () => {
  const transition = createStoryTransition(['a', 'b', 'c'], 'a', 'c');

  assert.deepEqual(transition, {
    activeId: 'c',
    departingId: 'a',
    visibleIds: ['a', 'c'],
    hasRoute: true,
  });
});

test('falls back to the first marker for an unknown requested scene', () => {
  const transition = createStoryTransition(['a', 'b', 'c'], 'a', 'missing');

  assert.equal(transition.activeId, 'a');
  assert.equal(transition.departingId, undefined);
  assert.deepEqual(transition.visibleIds, ['a']);
  assert.equal(transition.hasRoute, false);
});
