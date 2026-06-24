export type StoryTransition = {
  activeId: string;
  departingId: string | undefined;
  visibleIds: string[];
  hasRoute: boolean;
};

export function createStoryTransition(
  markerIds: string[],
  previousId: string,
  requestedId: string,
): StoryTransition;
