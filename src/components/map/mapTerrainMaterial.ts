// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 宋夏天Dazzle
// 作者全平台ID：宋夏天Dazzle；公众号：送你整个夏天
// Source: https://github.com/songsummer920-dazzle/three-scope-map-skill

import * as THREE from 'three';
import diffuseMapUrl from '../../assets/textures/map/terrain-diffuse.jpg';
import heightMapUrl from '../../assets/textures/map/terrain-height.jpg';
import normalMapUrl from '../../assets/textures/map/terrain-normal.jpg';
import roughnessMapUrl from '../../assets/textures/map/terrain-roughness.jpg';

export type MapTerrainMaterialConfig = {
  elevationScale: number;
  normalStrength: number;
  roughness: number;
  textureOpacity: number;
};

export const mapTerrainMaterialConfig: MapTerrainMaterialConfig = {
  elevationScale: 3.2,
  normalStrength: 0.62,
  roughness: 0.88,
  textureOpacity: 0.96,
};

type TerrainTextures = {
  diffuseMap: THREE.Texture;
  displacementMap: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
};

let terrainTextures: TerrainTextures | undefined;

function configureTexture(texture: THREE.Texture, isColorMap = false) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.1, 1.7);
  texture.offset.set(0.045, 0.08);
  texture.rotation = -0.05;
  texture.center.set(0.5, 0.5);
  texture.anisotropy = 12;
  if (isColorMap) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.needsUpdate = true;
  return texture;
}

export function getTerrainTextures() {
  if (!terrainTextures) {
    const loader = new THREE.TextureLoader();
    terrainTextures = {
      diffuseMap: configureTexture(loader.load(diffuseMapUrl), true),
      displacementMap: configureTexture(loader.load(heightMapUrl)),
      normalMap: configureTexture(loader.load(normalMapUrl)),
      roughnessMap: configureTexture(loader.load(roughnessMapUrl)),
    };
  }
  return terrainTextures;
}

export function createMapTerrainMaterial(
  config: MapTerrainMaterialConfig = mapTerrainMaterialConfig,
) {
  const textures = getTerrainTextures();
  const material = new THREE.MeshStandardMaterial({
    color: '#1b2418',
    emissive: '#090d08',
    emissiveIntensity: 0.06,
    map: textures.diffuseMap,
    displacementMap: textures.displacementMap,
    displacementScale: config.elevationScale,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(config.normalStrength, config.normalStrength),
    roughnessMap: textures.roughnessMap,
    roughness: config.roughness,
    metalness: 0.01,
    transparent: true,
    opacity: config.textureOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  material.userData.terrainConfig = { ...config };
  return material;
}
