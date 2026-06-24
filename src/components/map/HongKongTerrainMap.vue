<template>
  <div ref="host" class="map-host">
    <div v-if="loading" class="terrain-loading">{{ loadingMessage }}</div>
    <div v-if="errorMessage" class="terrain-error">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneFocus } from '../../data/hkHistory';
import {
  getHongKongTerrainMarkerBySceneKey,
  hongKongTerrainBounds,
  hongKongTerrainMarkerOrder,
  type TerrainSceneMarker,
} from './hkTerrainData';
import { createStoryTransition } from './storyNavigation.js';
import { getHistoricalLayer } from './historicalLayers.js';
import {
  loadHongKongTerrainAtlas,
  sampleTerrainHeight,
  terrainPointFromLngLat,
  type TerrainAtlas,
} from './hkTerrainLoader';
import { getCameraShot, type CameraShot } from './cameraDirector.js';

type TerrainMapProps = {
  sceneKey: string;
  sceneFocus: SceneFocus;
  sceneTitle: string;
  sceneDate: string;
};

type CameraPreset = {
  fov: number;
  position: [number, number, number];
  target: [number, number, number];
};

type CameraOffset = {
  fov: number;
  position: [number, number, number];
  targetLift: number;
  tweenDuration: number;
  followLerp: number;
};

type CameraTween = {
  from: CameraPreset;
  to: CameraPreset;
  startedAt: number;
  duration: number;
};

type RouteTransition = {
  curve: THREE.QuadraticBezierCurve3;
  startedAt: number;
  duration: number;
  totalPoints: number;
  departingId: string;
  activeId: string;
  revealed: boolean;
};

type CombatEffect = {
  markerId: string;
  group: THREE.Group;
  tracers: [THREE.Line, THREE.Line];
  muzzles: [THREE.Sprite, THREE.Sprite];
  phase: number;
};

const props = defineProps<TerrainMapProps>();

const host = ref<HTMLElement>();
const loading = ref(true);
const loadingMessage = ref('載入真實地形瓦片…');
const errorMessage = ref('');

let scene: THREE.Scene | undefined;
let camera: THREE.PerspectiveCamera | undefined;
let renderer: THREE.WebGLRenderer | undefined;
let labelRenderer: CSS2DRenderer | undefined;
let controls: OrbitControls | undefined;
let resizeObserver: ResizeObserver | undefined;
let raf = 0;

let terrainRoot: THREE.Group | undefined;
let terrainMesh: THREE.Mesh | undefined;
let historicalLayerGroup: THREE.Group | undefined;
let markerGroup: THREE.Group | undefined;
let routeLine: THREE.Line | undefined;
let routeGlowLine: THREE.Line | undefined;
let routeCursor: THREE.Mesh | undefined;
let routeTransition: RouteTransition | undefined;
let activeMarkerId = '';
let hoveredMarkerId = '';
let activeFollowTarget: THREE.Vector3 | undefined;
let activeFollowOffset = new THREE.Vector3(180, 460, 520);
let activeFollowFov = 26;
let activeCameraShot: CameraShot = getCameraShot(0);
let sceneCameraTween: CameraTween | undefined;
let atlas: TerrainAtlas | undefined;
let loadingToken = 0;

const cameraStorageKey = 'hk-terrain-camera-view:v1';
const worldWidth = 2000;
const worldDepth = 1970;
const heightScale = 0.28;
const terrainSegments = 420;

const cameraOffsets: Record<SceneFocus, CameraOffset> = {
  newTerritories: {
    fov: 26,
    position: [190, 520, 520],
    targetLift: 34,
    tweenDuration: 1.18,
    followLerp: 0.05,
  },
  wongMoYing: {
    fov: 25,
    position: [160, 430, 420],
    targetLift: 26,
    tweenDuration: 1.12,
    followLerp: 0.055,
  },
  rescue: {
    fov: 25,
    position: [170, 450, 440],
    targetLift: 28,
    tweenDuration: 1.16,
    followLerp: 0.055,
  },
  shaTin: {
    fov: 24,
    position: [150, 400, 390],
    targetLift: 24,
    tweenDuration: 1.08,
    followLerp: 0.06,
  },
  kaiTak: {
    fov: 24,
    position: [140, 380, 360],
    targetLift: 22,
    tweenDuration: 1.05,
    followLerp: 0.065,
  },
  sea: {
    fov: 27,
    position: [210, 560, 600],
    targetLift: 30,
    tweenDuration: 1.22,
    followLerp: 0.048,
  },
  harbour: {
    fov: 25,
    position: [150, 400, 400],
    targetLift: 24,
    tweenDuration: 1.1,
    followLerp: 0.06,
  },
  wuGauTang: {
    fov: 25,
    position: [170, 450, 450],
    targetLift: 28,
    tweenDuration: 1.12,
    followLerp: 0.055,
  },
  kerr: {
    fov: 24,
    position: [140, 360, 360],
    targetLift: 22,
    tweenDuration: 1.04,
    followLerp: 0.067,
  },
  postwar: {
    fov: 26,
    position: [180, 500, 500],
    targetLift: 32,
    tweenDuration: 1.14,
    followLerp: 0.05,
  },
};

const markerBySceneKey = new Map(hongKongTerrainMarkerOrder.map((marker) => [marker.id, marker]));
const markerGroups = new Map<string, THREE.Group>();
const labelElements = new Map<string, HTMLDivElement>();
const scenePulseNodes: Array<{ object: THREE.Sprite; baseScale: number; phase: number; fire?: boolean; baseIntensity?: number }> = [];
const combatEffects: CombatEffect[] = [];
const markerMeshes: THREE.Mesh[] = [];
const interactiveMeshes: THREE.Mesh[] = [];
const markerIds = hongKongTerrainMarkerOrder.map((marker) => marker.id);

function getHostSize() {
  if (!host.value) return { width: 0, height: 0 };
  const { width, height } = host.value.getBoundingClientRect();
  return { width: Math.max(1, width), height: Math.max(1, height) };
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.LineSegments || child instanceof THREE.Points)) {
      return;
    }
    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material?.dispose());
  });
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function isCameraPreset(value: unknown): value is CameraPreset {
  const candidate = value as Partial<CameraPreset> | undefined;
  return !!candidate
    && typeof candidate.fov === 'number'
    && Array.isArray(candidate.position)
    && candidate.position.length === 3
    && candidate.position.every((item) => typeof item === 'number')
    && Array.isArray(candidate.target)
    && candidate.target.length === 3
    && candidate.target.every((item) => typeof item === 'number');
}

function readSavedCameraPreset() {
  try {
    const raw = window.localStorage.getItem(cameraStorageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CameraPreset;
    return isCameraPreset(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeSavedCameraPreset(preset: CameraPreset) {
  window.localStorage.setItem(cameraStorageKey, JSON.stringify(preset));
}

function getCurrentCameraPreset(): CameraPreset | undefined {
  if (!camera || !controls) return undefined;
  return {
    fov: camera.fov,
    position: [camera.position.x, camera.position.y, camera.position.z],
    target: [controls.target.x, controls.target.y, controls.target.z],
  };
}

function resolveMarkerPreset(
  marker = markerBySceneKey.get(props.sceneKey) ?? hongKongTerrainMarkerOrder[0],
  atlasRef = atlas,
): CameraPreset {
  const offset = cameraOffsets[marker.focus] ?? cameraOffsets.newTerritories;
  const markerIndex = Math.max(0, markerIds.indexOf(marker.id));
  const shot = getCameraShot(markerIndex);
  if (!atlasRef) {
    return {
      fov: offset.fov + shot.fovDelta,
      position: offset.position,
      target: [0, offset.targetLift, 0] as [number, number, number],
    };
  }
  const anchor = getMarkerPosition(marker, atlasRef);
  const cameraOffset = new THREE.Vector3(...offset.position)
    .multiplyScalar(shot.distanceMultiplier);
  cameraOffset.y += shot.elevation;
  const cameraPosition = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), shot.yaw);
  activeCameraShot = shot;
  activeFollowTarget = anchor.clone();
  activeFollowOffset.copy(cameraOffset);
  activeFollowFov = offset.fov + shot.fovDelta;
  return {
    fov: activeFollowFov,
    position: [
      anchor.x + cameraPosition.x,
      anchor.y + cameraPosition.y,
      anchor.z + cameraPosition.z,
    ],
    target: [anchor.x, anchor.y + offset.targetLift, anchor.z],
  };
}

function getCameraOffset(marker: TerrainSceneMarker) {
  return cameraOffsets[marker.focus] ?? cameraOffsets.newTerritories;
}

function applyCameraPreset(preset: CameraPreset) {
  if (!camera || !controls) return;
  camera.fov = preset.fov;
  camera.position.set(...preset.position);
  controls.target.set(...preset.target);
  camera.updateProjectionMatrix();
}

function startCameraTween(target: CameraPreset, duration = 1.08) {
  if (!camera || !controls) return;
  sceneCameraTween = {
    from: getCurrentCameraPreset() ?? target,
    to: target,
    startedAt: performance.now() / 1000,
    duration,
  };
}

function makeGlowTexture(color = '#E8FF4F') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Glow texture canvas unavailable');
  }
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.25, 'rgba(232, 255, 79, 0.72)');
  gradient.addColorStop(1, 'rgba(232, 255, 79, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeSceneMarkerLabel(markerDate: string, title: string, detail: string, emphasis = false, fire = false) {
  const labelAnchor = document.createElement('div');
  labelAnchor.className = 'scene-node-anchor';
  const label = document.createElement('div');
  label.className = `scene-node ${emphasis ? 'is-main' : 'is-support'}${fire ? ' is-fire' : ''}`;
  label.innerHTML = `
    <span class="scene-node-date">${markerDate}</span>
    <strong>${title}</strong>
    <small>${detail}</small>
  `;
  labelAnchor.appendChild(label);
  return labelAnchor;
}

function makePlaceLabel(labelText: string, category: 'city' | 'sea' | 'ridge' | 'route', highlight = false) {
  const labelAnchor = document.createElement('div');
  labelAnchor.className = `terrain-place-anchor ${category} ${highlight ? 'is-highlight' : ''}`;
  const label = document.createElement('div');
  label.className = 'point';
  label.innerHTML = `
    <div class="dot"></div>
    <div class="label">${labelText}</div>
  `;
  labelAnchor.appendChild(label);
  return labelAnchor;
}

function clearSceneArtifacts() {
  scenePulseNodes.length = 0;
  combatEffects.length = 0;
  markerMeshes.length = 0;
  interactiveMeshes.length = 0;
  markerGroups.clear();
  labelElements.forEach((element) => element.remove());
  labelElements.clear();
  routeLine = undefined;
  routeGlowLine = undefined;
  routeCursor = undefined;
  routeTransition = undefined;
  historicalLayerGroup = undefined;
  markerGroup = undefined;
}

function getMarkerPosition(marker: { coord: [number, number] }, atlasRef: TerrainAtlas) {
  return terrainPointFromLngLat(
    marker.coord[0],
    marker.coord[1],
    worldWidth,
    worldDepth,
    atlasRef,
    heightScale,
  );
}

function buildTerrainMesh(atlasRef: TerrainAtlas) {
  const geometry = new THREE.PlaneGeometry(worldWidth, worldDepth, terrainSegments, terrainSegments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const uvs = geometry.attributes.uv as THREE.BufferAttribute;
  const halfWidth = worldWidth / 2;
  const halfDepth = worldDepth / 2;

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const u = (x + halfWidth) / worldWidth;
    const v = (z + halfDepth) / worldDepth;
    const height = sampleTerrainHeight(atlasRef, u, v) * heightScale;
    const edge = Math.min(u, 1 - u, v, 1 - v);
    const sink = THREE.MathUtils.smoothstep(edge, 0, 0.04);
    positions.setY(i, height * (1 - sink) - 24 * sink);
    uvs.setXY(i, u, 1 - v);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: atlasRef.imageryTexture,
    roughnessMap: atlasRef.heightTexture,
    roughness: 0.94,
    metalness: 0.02,
    color: '#d9e0cf',
    emissive: '#0a1008',
    emissiveIntensity: 0.12,
    transparent: false,
    side: THREE.DoubleSide,
  });
  material.displacementMap = atlasRef.heightTexture;
  material.displacementScale = 4.8;
  material.displacementBias = -1.6;

  terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = false;
  terrainMesh.renderOrder = 3;
  return terrainMesh;
}

function buildAtmosphereRing() {
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0, 2, 0);

  const outer = new THREE.Mesh(
    new THREE.RingGeometry(700, 710, 180),
    new THREE.MeshBasicMaterial({
      color: '#E8FF4F',
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  outer.rotation.x = -Math.PI / 2;
  ringGroup.add(outer);

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(440, 446, 160),
    new THREE.MeshBasicMaterial({
      color: '#b5ca40',
      transparent: true,
      opacity: 0.032,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  inner.rotation.x = -Math.PI / 2;
  ringGroup.add(inner);

  return ringGroup;
}

function buildRouteLine() {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({
    color: '#E8FF4F',
    transparent: true,
    opacity: 0.56,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });
  const glowMaterial = new THREE.LineBasicMaterial({
    color: '#ffd86a',
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });

  routeLine = new THREE.Line(geometry, material);
  routeLine.renderOrder = 8;
  routeGlowLine = new THREE.Line(geometry.clone(), glowMaterial);
  routeGlowLine.renderOrder = 7;

  const cursorGeometry = new THREE.SphereGeometry(8, 18, 18);
  const cursorMaterial = new THREE.MeshBasicMaterial({
    color: '#ffe39c',
    transparent: true,
    opacity: 0.84,
    blending: THREE.AdditiveBlending,
  });
  routeCursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
  routeCursor.renderOrder = 9;
  routeLine.visible = false;
  routeGlowLine.visible = false;
  routeCursor.visible = false;
}

function clearHistoricalLayer() {
  if (!historicalLayerGroup) return;
  historicalLayerGroup.children.slice().forEach((child) => {
    historicalLayerGroup?.remove(child);
    disposeObject3D(child);
  });
}

function buildHistoricalRoute(path: [number, number][], color: THREE.ColorRepresentation, atlasRef: TerrainAtlas) {
  const points = path.map(([lng, lat]) => {
    const point = getMarkerPosition({ coord: [lng, lat] }, atlasRef);
    point.y += 28;
    return point;
  });
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.16);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 72, 2.7, 8, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.74,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const glow = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(72)),
    new THREE.LineBasicMaterial({
      color: '#f4f6d2',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  glow.renderOrder = 11;
  historicalLayerGroup?.add(tube, glow);
}

function buildImpactZone(marker: TerrainSceneMarker, radius: number, atlasRef: TerrainAtlas) {
  const center = getMarkerPosition(marker, atlasRef);
  const zone = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshBasicMaterial({
      color: '#d85b55',
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  zone.rotation.x = -Math.PI / 2;
  zone.position.copy(center);
  zone.position.y += 10;
  const perimeter = new THREE.Mesh(
    new THREE.RingGeometry(radius - 3, radius + 3, 64),
    new THREE.MeshBasicMaterial({
      color: '#ff7569',
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  perimeter.rotation.x = -Math.PI / 2;
  perimeter.position.copy(center);
  perimeter.position.y += 11;
  historicalLayerGroup?.add(zone, perimeter);
}

function buildGuerrillaBeacon(marker: TerrainSceneMarker, atlasRef: TerrainAtlas) {
  const center = getMarkerPosition(marker, atlasRef);
  [38, 58, 78].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 1.5, radius + 1.5, 56),
      new THREE.MeshBasicMaterial({
        color: '#E8FF4F',
        transparent: true,
        opacity: 0.48 - index * 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(center);
    ring.position.y += 8 + index * 2;
    historicalLayerGroup?.add(ring);
  });
}

function updateHistoricalLayer(marker: TerrainSceneMarker, atlasRef: TerrainAtlas) {
  if (!historicalLayerGroup) return;
  clearHistoricalLayer();
  const layer = getHistoricalLayer(marker.id);
  if (layer.kind === 'route' && layer.path) {
    const colors = { rescue: '#72b38a', sea: '#6db6e7', guerrilla: '#E8FF4F', enemy: '#d85b55' };
    buildHistoricalRoute(layer.path, colors[layer.category], atlasRef);
    return;
  }
  if (layer.kind === 'impact-zone') {
    buildImpactZone(marker, layer.radius ?? 72, atlasRef);
    return;
  }
  buildGuerrillaBeacon(marker, atlasRef);
}

function setMarkerPresentation(markerId: string, visible: boolean, labelVisible: boolean) {
  const group = markerGroups.get(markerId);
  if (!group) return;
  group.visible = visible;
  const label = group.getObjectByName('scene-marker-label');
  if (label) label.visible = labelVisible;
  const labelEl = labelElements.get(markerId);
  labelEl?.classList.toggle('is-active', visible && labelVisible && markerId === activeMarkerId);
}

function replaceRouteGeometry(line: THREE.Line, points: THREE.Vector3[]) {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  line.geometry.setDrawRange(0, 0);
}

function startRouteTransition(departing: TerrainSceneMarker, arriving: TerrainSceneMarker, atlasRef: TerrainAtlas, duration: number) {
  if (!routeLine || !routeGlowLine || !routeCursor) return;
  const start = getMarkerPosition(departing, atlasRef);
  const end = getMarkerPosition(arriving, atlasRef);
  start.y += departing.emphasis ? 24 : 18;
  end.y += arriving.emphasis ? 24 : 18;
  const control = start.clone().lerp(end, 0.5);
  control.y += Math.max(74, start.distanceTo(end) * 0.18);
  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  const points = curve.getPoints(72);

  replaceRouteGeometry(routeLine, points);
  replaceRouteGeometry(routeGlowLine, points);
  routeLine.visible = true;
  routeGlowLine.visible = true;
  routeCursor.visible = true;
  if (routeLine.material instanceof THREE.LineBasicMaterial) routeLine.material.opacity = 0.76;
  if (routeGlowLine.material instanceof THREE.LineBasicMaterial) routeGlowLine.material.opacity = 0.2;
  routeTransition = {
    curve,
    startedAt: performance.now() / 1000,
    duration,
    totalPoints: points.length,
    departingId: departing.id,
    activeId: arriving.id,
    revealed: false,
  };
}

function setActiveMarker(markerId: string, atlasRef: TerrainAtlas) {
  const transition = createStoryTransition(markerIds, activeMarkerId, markerId);
  activeMarkerId = transition.activeId;
  markerGroups.forEach((group, id) => {
    group.scale.setScalar(group.userData.baseScale ?? 1);
    setMarkerPresentation(id, false, false);
  });
  const marker = markerBySceneKey.get(activeMarkerId) ?? hongKongTerrainMarkerOrder[0];
  const offset = getCameraOffset(marker);
  const target = resolveMarkerPreset(marker, atlasRef);
  updateHistoricalLayer(marker, atlasRef);
  startCameraTween(target, offset.tweenDuration);

  if (!transition.hasRoute || !transition.departingId) {
    routeTransition = undefined;
    if (routeLine && routeGlowLine && routeCursor) {
      routeLine.visible = false;
      routeGlowLine.visible = false;
      routeCursor.visible = false;
    }
    setMarkerPresentation(marker.id, true, true);
    return;
  }

  setMarkerPresentation(transition.departingId, true, false);
  startRouteTransition(
    markerBySceneKey.get(transition.departingId) ?? marker,
    marker,
    atlasRef,
    offset.tweenDuration,
  );
}

function makeSoldier(
  uniformColor: THREE.ColorRepresentation,
  helmetColor: THREE.ColorRepresentation,
  armbandColor: THREE.ColorRepresentation,
  position: THREE.Vector3,
  rotationY: number,
) {
  const soldier = new THREE.Group();
  soldier.position.copy(position);
  soldier.rotation.y = rotationY;

  const uniformMaterial = new THREE.MeshStandardMaterial({
    color: uniformColor,
    roughness: 0.82,
    metalness: 0.04,
  });
  const webbingMaterial = new THREE.MeshStandardMaterial({
    color: '#2c3024',
    roughness: 0.72,
    metalness: 0.12,
  });
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: '#c7a582',
    roughness: 0.92,
  });
  const bootMaterial = new THREE.MeshStandardMaterial({
    color: '#1b1a18',
    roughness: 0.72,
  });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 16),
    new THREE.MeshBasicMaterial({ color: '#050706', transparent: true, opacity: 0.3, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.1;
  shadow.scale.set(1.25, 0.58, 1);
  soldier.add(shadow);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 8.2, 4.1),
    uniformMaterial,
  );
  body.position.y = 9.5;
  soldier.add(body);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.9, 4.4), webbingMaterial);
  belt.position.y = 6.4;
  soldier.add(belt);

  [-1.8, 1.8].forEach((x, index) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.35, 6.5, 2.85), uniformMaterial);
    leg.position.set(x, 2.8, index === 0 ? -0.25 : 0.25);
    leg.rotation.z = index === 0 ? 0.08 : -0.08;
    soldier.add(leg);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.55, 4.2), bootMaterial);
    boot.position.set(x + (index === 0 ? 0.25 : -0.25), -0.45, 0.75);
    soldier.add(boot);
  });

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 12, 10),
    skinMaterial,
  );
  head.position.y = 16.3;
  soldier.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(2.85, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.68, metalness: 0.14 }),
  );
  helmet.position.y = 16.85;
  helmet.rotation.z = Math.PI;
  soldier.add(helmet);

  const helmetBrim = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.42, 4.9), webbingMaterial);
  helmetBrim.position.set(2.25, 16.7, 0);
  soldier.add(helmetBrim);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(3, 5.4, 4.6), webbingMaterial);
  backpack.position.set(-4.1, 10.7, 0);
  soldier.add(backpack);

  const rifle = new THREE.Group();
  rifle.position.set(5.2, 11.1, 0);
  rifle.rotation.z = -0.18;
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(16, 0.55, 0.55), bootMaterial);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.15, 1.15), new THREE.MeshStandardMaterial({ color: '#65422d', roughness: 0.74 }));
  stock.position.x = -4.6;
  const magazine = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.4, 0.7), bootMaterial);
  magazine.position.set(-0.6, -1.2, 0);
  rifle.add(barrel, stock, magazine);
  soldier.add(rifle);

  [-1, 1].forEach((side, index) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 7.2, 8), uniformMaterial);
    arm.position.set(2.7, 10.6, side * 2.2);
    arm.rotation.z = index === 0 ? -1.02 : -0.78;
    soldier.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(1.15, 8, 8), skinMaterial);
    hand.position.set(6.1, 9.8, side * 1.35);
    soldier.add(hand);
  });

  const armband = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.9, 2.75),
    new THREE.MeshBasicMaterial({ color: armbandColor }),
  );
  armband.position.set(2.8, 11.8, 2.2);
  soldier.add(armband);
  return soldier;
}

function makeTracer(from: THREE.Vector3, to: THREE.Vector3, color: THREE.ColorRepresentation) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const tracer = new THREE.Line(geometry, material);
  tracer.renderOrder = 12;
  return tracer;
}

function buildCombatEffect(markerId: string, fireTexture: THREE.Texture, phase: number): CombatEffect {
  const group = new THREE.Group();
  group.position.set(0, 32, -52);
  group.scale.setScalar(2.5);
  const guerrillaMuzzle = new THREE.Vector3(-15, 13, -7);
  const enemyMuzzle = new THREE.Vector3(15, 13, 7);
  group.add(makeSoldier('#576a43', '#39452f', '#E8FF4F', new THREE.Vector3(-23, 0, -9), 0.18));
  group.add(makeSoldier('#78634c', '#665642', '#d85b55', new THREE.Vector3(23, 0, 9), Math.PI + 0.18));

  const guerrillaFlash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: fireTexture,
    color: '#ffe39c',
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  guerrillaFlash.position.copy(guerrillaMuzzle);
  guerrillaFlash.scale.set(15, 15, 1);
  group.add(guerrillaFlash);

  const enemyFlash = guerrillaFlash.clone();
  enemyFlash.material = (guerrillaFlash.material as THREE.SpriteMaterial).clone();
  (enemyFlash.material as THREE.SpriteMaterial).color.set('#ff8b3d');
  enemyFlash.position.copy(enemyMuzzle);
  group.add(enemyFlash);

  const forwardTracer = makeTracer(guerrillaMuzzle, enemyMuzzle, '#ffe39c');
  const returnTracer = makeTracer(enemyMuzzle, guerrillaMuzzle, '#ff7e4a');
  group.add(forwardTracer, returnTracer);
  return {
    markerId,
    group,
    tracers: [forwardTracer, returnTracer],
    muzzles: [guerrillaFlash, enemyFlash],
    phase,
  };
}

function buildMarkers(atlasRef: TerrainAtlas) {
  markerGroup = new THREE.Group();

  const glowTexture = makeGlowTexture();
  const fireTexture = makeGlowTexture('#ffb35b');
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: '#E8FF4F',
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
  });
  const fireMaterial = new THREE.MeshBasicMaterial({
    color: '#ffb35b',
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });

  hongKongTerrainMarkerOrder.forEach((marker, index) => {
    const basePosition = getMarkerPosition(marker, atlasRef);
    basePosition.y += marker.emphasis ? 18 : 12;

    const node = new THREE.Group();
    node.position.copy(basePosition);

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(marker.emphasis ? 7.4 : 5.4, 36),
      marker.fire ? fireMaterial.clone() : coreMaterial.clone(),
    );
    core.rotation.x = -Math.PI / 2;
    core.position.y = 2.5;
    node.add(core);
    markerMeshes.push(core);
    interactiveMeshes.push(core);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(marker.emphasis ? 10 : 8, marker.emphasis ? 14 : 11, 48),
      new THREE.MeshBasicMaterial({
        color: marker.fire ? '#ffb35b' : '#E8FF4F',
        transparent: true,
        opacity: marker.fire ? 0.46 : 0.38,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 2.4;
    node.add(ring);
    markerMeshes.push(ring);
    interactiveMeshes.push(ring);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: marker.fire ? fireTexture : glowTexture,
      color: marker.fire ? '#ff9f46' : '#E8FF4F',
      transparent: true,
      opacity: marker.fire ? 0.72 : 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    glow.position.y = 14;
    glow.scale.set(marker.emphasis ? 52 : 42, marker.emphasis ? 52 : 42, 1);
    node.add(glow);
    scenePulseNodes.push({
      object: glow,
      baseScale: marker.emphasis ? 52 : 42,
      phase: index * 0.83,
      fire: marker.fire,
      baseIntensity: marker.fire ? 1.2 : 0.8,
    });

    if (marker.fire) {
      const light = new THREE.PointLight('#ff8b3d', marker.emphasis ? 1.8 : 1.15, 200, 2);
      light.position.y = 16;
      light.userData.baseIntensity = light.intensity;
      light.userData.phase = index * 0.77;
      node.add(light);

      const fireHalo = new THREE.Mesh(
        new THREE.RingGeometry(marker.emphasis ? 14 : 11, marker.emphasis ? 24 : 18, 52),
        new THREE.MeshBasicMaterial({
          color: '#ff9f46',
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      fireHalo.rotation.x = -Math.PI / 2;
      fireHalo.position.y = 3.2;
      node.add(fireHalo);
      markerMeshes.push(fireHalo);

      const combatEffect = buildCombatEffect(marker.id, fireTexture, index * 0.83);
      node.add(combatEffect.group);
      combatEffects.push(combatEffect);
    }

    const labelAnchor = makeSceneMarkerLabel(marker.date, marker.label, marker.detail, marker.emphasis, marker.fire);
    labelElements.set(marker.id, labelAnchor);
    const label = new CSS2DObject(labelAnchor);
    label.name = 'scene-marker-label';
    label.position.y = 24;
    node.add(label);

    node.userData.markerId = marker.id;
    node.userData.baseScale = marker.emphasis ? 1.18 : 1;
    node.userData.phase = index * 0.9;
    node.userData.fire = marker.fire ?? false;
    markerGroups.set(marker.id, node);
    markerGroup?.add(node);
  });
}

function buildTerrainScene(atlasRef: TerrainAtlas) {
  if (!scene) return;
  terrainRoot = new THREE.Group();
  terrainRoot.rotation.y = THREE.MathUtils.degToRad(-14);
  terrainRoot.position.set(0, 0, 0);

  const terrain = buildTerrainMesh(atlasRef);
  terrainRoot.add(terrain);
  terrainRoot.add(buildAtmosphereRing());
  historicalLayerGroup = new THREE.Group();
  historicalLayerGroup.renderOrder = 6;
  terrainRoot.add(historicalLayerGroup);
  buildRouteLine();
  if (routeLine && routeGlowLine && routeCursor) {
    terrainRoot.add(routeGlowLine);
    terrainRoot.add(routeLine);
    terrainRoot.add(routeCursor);
  }
  buildMarkers(atlasRef);
  if (markerGroup) {
    terrainRoot.add(markerGroup);
  }

  const baseAmbient = new THREE.AmbientLight('#d7eeaf', 1.25);
  const sunlight = new THREE.DirectionalLight('#f1ffbf', 2.5);
  sunlight.position.set(380, 760, 520);
  sunlight.castShadow = false;
  scene.add(baseAmbient);
  scene.add(sunlight);
  scene.add(terrainRoot);
  setActiveMarker(props.sceneKey, atlasRef);

}

function updateCameraTween(t: number) {
  if (!camera || !controls || !sceneCameraTween) return;
  const progress = Math.min(1, (t - sceneCameraTween.startedAt) / sceneCameraTween.duration);
  const eased = 1 - (1 - progress) ** 3;
  const from = sceneCameraTween.from;
  const to = sceneCameraTween.to;
  camera.position.lerpVectors(
    new THREE.Vector3(...from.position),
    new THREE.Vector3(...to.position),
    eased,
  );
  controls.target.lerpVectors(
    new THREE.Vector3(...from.target),
    new THREE.Vector3(...to.target),
    eased,
  );
  camera.fov = THREE.MathUtils.lerp(from.fov, to.fov, eased);
  camera.updateProjectionMatrix();
  if (progress >= 1) {
    sceneCameraTween = undefined;
  }
}

function updateMarkerMotion(t: number) {
  scenePulseNodes.forEach((node) => {
    const scalePulse = 1 + Math.sin(t * 2.6 + node.phase) * 0.075;
    node.object.scale.setScalar(node.baseScale * scalePulse);
    const material = node.object.material as THREE.SpriteMaterial | undefined;
    if (material) {
      const baseOpacity = node.fire ? 0.72 : 0.58;
      material.opacity = baseOpacity * (0.82 + Math.sin(t * 4.6 + node.phase) * 0.18);
    }
    const parent = node.object.parent;
    const pointLight = parent?.children.find((child) => child instanceof THREE.PointLight) as THREE.PointLight | undefined;
    if (pointLight) {
      const baseIntensity = pointLight.userData.baseIntensity ?? pointLight.intensity;
      pointLight.intensity = baseIntensity * (0.78 + Math.max(0, Math.sin(t * 11 + (pointLight.userData.phase as number | undefined ?? 0))) * 0.46);
    }
  });

  markerGroups.forEach((group, id) => {
    const isActive = id === activeMarkerId;
    const breath = isActive ? 1 + Math.sin(t * 1.6) * 0.03 : 1;
    group.scale.setScalar((group.userData.baseScale ?? 1) * breath);
  });

}

function updateCombatEffects(t: number) {
  combatEffects.forEach((effect) => {
    const active = effect.markerId === activeMarkerId;
    effect.group.visible = active;
    if (!active) return;
    const leftFires = Math.sin(t * 6 + effect.phase) >= 0;
    effect.tracers[0].visible = leftFires;
    effect.tracers[1].visible = !leftFires;
    effect.muzzles[0].visible = leftFires;
    effect.muzzles[1].visible = !leftFires;
    effect.muzzles.forEach((muzzle, index) => {
      const firing = index === 0 ? leftFires : !leftFires;
      muzzle.scale.setScalar(firing ? 16 + Math.sin(t * 20 + effect.phase) * 3 : 1);
    });
  });
}

function updateStoryTransition(t: number) {
  if (!routeTransition || !routeLine || !routeGlowLine || !routeCursor) return;
  const progress = Math.min(1, (t - routeTransition.startedAt) / routeTransition.duration);
  const drawProgress = Math.min(1, progress / 0.66);
  const drawCount = Math.max(2, Math.floor(routeTransition.totalPoints * drawProgress));
  routeLine.geometry.setDrawRange(0, drawCount);
  routeGlowLine.geometry.setDrawRange(0, drawCount);
  routeCursor.position.copy(routeTransition.curve.getPoint(drawProgress));
  routeCursor.scale.setScalar(1 + Math.sin(t * 8.4) * 0.16);
  if (routeCursor.material instanceof THREE.MeshBasicMaterial) {
    routeCursor.material.opacity = 0.86 + Math.sin(t * 7.3) * 0.1;
  }

  if (progress >= 0.66 && !routeTransition.revealed) {
    routeTransition.revealed = true;
    setMarkerPresentation(routeTransition.activeId, true, true);
  }

  const fade = progress > 0.8 ? 1 - ((progress - 0.8) / 0.2) : 1;
  if (routeLine.material instanceof THREE.LineBasicMaterial) routeLine.material.opacity = 0.76 * fade;
  if (routeGlowLine.material instanceof THREE.LineBasicMaterial) routeGlowLine.material.opacity = 0.2 * fade;

  if (progress >= 1) {
    setMarkerPresentation(routeTransition.departingId, false, false);
    routeLine.visible = false;
    routeGlowLine.visible = false;
    routeCursor.visible = false;
    routeTransition = undefined;
  }
}

function updateIdleCamera(t: number) {
  if (!camera || !controls || sceneCameraTween || !activeFollowTarget) return;
  const marker = markerBySceneKey.get(activeMarkerId) ?? hongKongTerrainMarkerOrder[0];
  const offset = getCameraOffset(marker);
  const orbit = new THREE.Vector3(...activeFollowOffset.toArray() as [number, number, number]);
  orbit.applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    activeCameraShot.yaw + Math.sin(t * 0.1) * activeCameraShot.drift,
  );
  const desiredTarget = activeFollowTarget.clone();
  const desiredPosition = desiredTarget.clone().add(orbit);
  camera.position.lerp(desiredPosition, offset.followLerp);
  controls.target.lerp(desiredTarget, offset.followLerp + 0.03);
  camera.fov = activeFollowFov;
  camera.updateProjectionMatrix();
}

function renderFrame() {
  raf = requestAnimationFrame(renderFrame);
  const t = performance.now() / 1000;
  updateCameraTween(t);
  updateIdleCamera(t);
  updateMarkerMotion(t);
  updateCombatEffects(t);
  updateStoryTransition(t);
  controls?.update();
  if (scene && camera && renderer) {
    renderer.render(scene, camera);
  }
  if (scene && camera && labelRenderer) {
    labelRenderer.render(scene, camera);
  }
}

function onPointerMove(event: PointerEvent) {
  if (!renderer || !camera) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
  const markerId = hit?.object.parent?.userData.markerId;
  if (typeof markerId === 'string') {
    if (hoveredMarkerId && hoveredMarkerId !== markerId) {
      const previous = labelElements.get(hoveredMarkerId);
      previous?.classList.remove('is-hovered');
    }
    hoveredMarkerId = markerId;
    const label = labelElements.get(markerId);
    label?.classList.add('is-hovered');
    return;
  }
  if (hoveredMarkerId) {
    const label = labelElements.get(hoveredMarkerId);
    label?.classList.remove('is-hovered');
  }
  hoveredMarkerId = '';
}

function onPointerDown(event: PointerEvent) {
  if (!renderer || !camera) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
  const markerId = hit?.object.parent?.userData.markerId;
  if (typeof markerId === 'string' && atlas) {
    setActiveMarker(markerId, atlas);
  }
}

async function rebuildTerrainScene() {
  if (!scene || !host.value) return;
  const token = ++loadingToken;
  loading.value = true;
  loadingMessage.value = '載入真實地形瓦片…';
  errorMessage.value = '';
  try {
    const terrainAtlas = await loadHongKongTerrainAtlas();
    if (token !== loadingToken) return;
    atlas = terrainAtlas;
    if (terrainRoot) {
      scene.remove(terrainRoot);
      disposeObject3D(terrainRoot);
    }
    clearSceneArtifacts();
    buildTerrainScene(terrainAtlas);
    if (camera && controls) {
      const saved = readSavedCameraPreset();
    if (saved) {
      applyCameraPreset(saved);
    } else {
        applyCameraPreset(resolveMarkerPreset(markerBySceneKey.get(props.sceneKey), terrainAtlas));
      }
    }
    loading.value = false;
  } catch (error) {
    if (token !== loadingToken) return;
    errorMessage.value = error instanceof Error ? error.message : '地形載入失敗';
    loading.value = false;
    console.error(error);
  }
}

function setupScene() {
  if (!host.value) return;
  const { width, height } = getHostSize();
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#aab9c5');
  scene.fog = new THREE.Fog('#aab9c5', 1100, 2600);

  camera = new THREE.PerspectiveCamera(30, width / height, 1, 4000);
  camera.position.set(240, 770, 810);
  camera.lookAt(0, 80, 0);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.value.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.className = 'map-label-layer';
  host.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.minDistance = 160;
  controls.maxDistance = 2200;
  controls.target.set(0, 80, 0);

  resizeObserver = new ResizeObserver(() => {
    if (!host.value || !camera || !renderer || !labelRenderer) return;
    const size = getHostSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
    labelRenderer.setSize(size.width, size.height);
  });
  resizeObserver.observe(host.value);

  renderFrame();
}

onMounted(() => {
  setupScene();
  void rebuildTerrainScene();
});

watch(
  () => [props.sceneKey, props.sceneFocus, props.sceneTitle, props.sceneDate],
  () => {
    if (!atlas) return;
    const marker = getHongKongTerrainMarkerBySceneKey(props.sceneKey);
    setActiveMarker(marker.id, atlas);
  },
);

onBeforeUnmount(() => {
  loadingToken += 1;
  cancelAnimationFrame(raf);
  resizeObserver?.disconnect();
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
  }
  controls?.dispose();
  if (terrainRoot && scene) {
    scene.remove(terrainRoot);
    disposeObject3D(terrainRoot);
  }
  if (scene) {
    scene.children.slice().forEach((child) => {
      scene?.remove(child);
      disposeObject3D(child);
    });
  }
  labelRenderer?.domElement.remove();
  renderer?.dispose();
});
</script>

<style scoped>
.map-host {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.map-host :deep(.map-label-layer) {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.map-host :deep(.scene-node-anchor) {
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.map-host :deep(.scene-node) {
  min-width: 138px;
  max-width: 220px;
  padding: 10px 12px 11px;
  border-radius: 14px;
  background: rgba(6, 9, 13, 0.9);
  border: 1px solid rgba(232, 255, 79, 0.22);
  color: #f5f3eb;
  backdrop-filter: blur(12px);
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.24),
    0 0 24px rgba(232, 255, 79, 0.06);
}

.map-host :deep(.scene-node.is-main) {
  border-color: rgba(232, 255, 79, 0.42);
  background: rgba(10, 14, 20, 0.92);
}

.map-host :deep(.scene-node.is-fire) {
  border-color: rgba(255, 164, 73, 0.48);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.26),
    0 0 30px rgba(255, 161, 79, 0.12);
}

.map-host :deep(.scene-node-date) {
  display: inline-block;
  margin-bottom: 5px;
  color: #e8ff4f;
  letter-spacing: 0.12em;
  font-size: 0.74rem;
}

.map-host :deep(.scene-node strong) {
  display: block;
  font-size: 1rem;
  line-height: 1.2;
}

.map-host :deep(.scene-node small) {
  display: block;
  margin-top: 6px;
  color: rgba(245, 243, 235, 0.8);
  line-height: 1.45;
  font-size: 0.76rem;
}

.map-host :deep(.scene-node.is-active) {
  transform: scale(1.08);
  border-color: rgba(232, 255, 79, 0.56);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.28),
    0 0 34px rgba(232, 255, 79, 0.18);
}

.map-host :deep(.scene-node.is-hovered) {
  transform: scale(1.05);
  border-color: rgba(255, 227, 156, 0.54);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.26),
    0 0 34px rgba(255, 227, 156, 0.18);
}

.map-host :deep(.terrain-place-anchor .point) {
  transform: translate(-50%, -50%) scale(0.88);
}

.map-host :deep(.terrain-place-anchor.is-highlight .point .dot) {
  background: #ffe39c;
  box-shadow: 0 0 0 0 rgba(255, 227, 156, 0.5);
}

.terrain-loading,
.terrain-error {
  position: absolute;
  left: 18px;
  top: 18px;
  z-index: 6;
  max-width: min(520px, calc(100% - 36px));
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(10, 14, 18, 0.72);
  border: 1px solid rgba(232, 255, 79, 0.28);
  color: #f2f1e7;
  font-size: 0.9rem;
  line-height: 1.5;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
}

.terrain-error {
  border-color: rgba(255, 116, 116, 0.38);
  color: #ffd8d8;
}
</style>
