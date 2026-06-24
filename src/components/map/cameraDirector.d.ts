export type CameraShot = {
  yaw: number;
  elevation: number;
  distanceMultiplier: number;
  fovDelta: number;
  drift: number;
};

export function getCameraShot(sceneIndex: number): CameraShot;
