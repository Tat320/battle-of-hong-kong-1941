/**
 * Produces the smallest visible set for a directed story transition.
 * The map consumes this state to avoid showing every historical event at once.
 */
export function createStoryTransition(markerIds, previousId, requestedId) {
  const activeId = markerIds.includes(requestedId) ? requestedId : markerIds[0];
  const departingId = previousId && previousId !== activeId && markerIds.includes(previousId)
    ? previousId
    : undefined;

  return {
    activeId,
    departingId,
    visibleIds: departingId ? [departingId, activeId] : [activeId],
    hasRoute: Boolean(departingId),
  };
}
