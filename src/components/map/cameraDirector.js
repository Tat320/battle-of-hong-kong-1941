const cameraShots = [
  { yaw: -0.2, elevation: 90, distanceMultiplier: 1.45, fovDelta: 5, drift: 0.05 },
  { yaw: 0.16, elevation: 55, distanceMultiplier: 1.36, fovDelta: 4, drift: 0.07 },
  { yaw: 0.34, elevation: 130, distanceMultiplier: 1.52, fovDelta: 6, drift: 0.06 },
];

/** Returns a repeatable wide establishing shot for each timeline position. */
export function getCameraShot(sceneIndex) {
  return cameraShots[((sceneIndex % cameraShots.length) + cameraShots.length) % cameraShots.length];
}
