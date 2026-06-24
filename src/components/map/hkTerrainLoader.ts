import * as THREE from 'three';
import { hongKongTerrainBounds } from './hkTerrainData';

export type TerrainAtlas = {
  width: number;
  height: number;
  heightData: Float32Array;
  imageryTexture: THREE.CanvasTexture;
  heightTexture: THREE.CanvasTexture;
  tilesX: number;
  tilesY: number;
};

const TILE_SIZE = 256;

function lngToTileX(lng: number, zoom: number) {
  return Math.floor(((lng + 180) / 360) * 2 ** zoom);
}

function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * 2 ** zoom,
  );
}

function mercatorY(lat: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

async function loadBitmapFromSources(sources: string[]) {
  let lastError: unknown;
  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const blob = await response.blob();
      return await createImageBitmap(blob);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Terrain tile load failed');
}

function buildLocalAndRemoteSources(
  kind: 'dem' | 'img',
  zoom: number,
  x: number,
  y: number,
) {
  if (kind === 'dem') {
    return [
      `${import.meta.env.BASE_URL}terrain/dem/${zoom}_${x}_${y}.png`,
      `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${x}/${y}.png`,
    ];
  }
  return [
    `${import.meta.env.BASE_URL}terrain/img/${zoom}_${x}_${y}.jpg`,
    `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/${zoom}/${y}/${x}.jpg`,
  ];
}

export async function loadHongKongTerrainAtlas() {
  const { minLng, maxLng, minLat, maxLat, zoom } = hongKongTerrainBounds;
  const x0 = lngToTileX(minLng, zoom);
  const x1 = lngToTileX(maxLng, zoom);
  const y0 = latToTileY(maxLat, zoom);
  const y1 = latToTileY(minLat, zoom);
  const tilesX = x1 - x0 + 1;
  const tilesY = y1 - y0 + 1;
  const width = tilesX * TILE_SIZE;
  const height = tilesY * TILE_SIZE;

  const demCanvas = document.createElement('canvas');
  demCanvas.width = width;
  demCanvas.height = height;
  const demCtx = demCanvas.getContext('2d', { willReadFrequently: true });
  if (!demCtx) throw new Error('DEM canvas unavailable');
  demCtx.fillStyle = 'rgb(128,0,0)';
  demCtx.fillRect(0, 0, width, height);

  const imgCanvas = document.createElement('canvas');
  imgCanvas.width = width;
  imgCanvas.height = height;
  const imgCtx = imgCanvas.getContext('2d');
  if (!imgCtx) throw new Error('Imagery canvas unavailable');
  imgCtx.fillStyle = '#0c1413';
  imgCtx.fillRect(0, 0, width, height);

  const tileJobs: Array<Promise<void>> = [];
  for (let x = x0; x <= x1; x += 1) {
    for (let y = y0; y <= y1; y += 1) {
      tileJobs.push(
        (async () => {
          const [demBitmap, imgBitmap] = await Promise.all([
            loadBitmapFromSources(buildLocalAndRemoteSources('dem', zoom, x, y)),
            loadBitmapFromSources(buildLocalAndRemoteSources('img', zoom, x, y)),
          ]);
          const dx = (x - x0) * TILE_SIZE;
          const dy = (y - y0) * TILE_SIZE;
          demCtx.drawImage(demBitmap, dx, dy);
          imgCtx.drawImage(imgBitmap, dx, dy);
          demBitmap.close();
          imgBitmap.close();
        })(),
      );
    }
  }

  await Promise.all(tileJobs);

  const pixels = demCtx.getImageData(0, 0, width, height).data;
  const heightData = new Float32Array(width * height);
  for (let i = 0; i < heightData.length; i += 1) {
    const j = i * 4;
    heightData[i] = (pixels[j] * 256 + pixels[j + 1] + pixels[j + 2] / 256) - 32768;
  }

  const imageryTexture = new THREE.CanvasTexture(imgCanvas);
  imageryTexture.colorSpace = THREE.SRGBColorSpace;
  imageryTexture.anisotropy = 12;
  imageryTexture.needsUpdate = true;

  const heightTexture = new THREE.CanvasTexture(demCanvas);
  heightTexture.colorSpace = THREE.NoColorSpace;
  heightTexture.anisotropy = 12;
  heightTexture.needsUpdate = true;

  return {
    width,
    height,
    heightData,
    imageryTexture,
    heightTexture,
    tilesX,
    tilesY,
  } satisfies TerrainAtlas;
}

export function sampleTerrainHeight(atlas: TerrainAtlas, u: number, v: number) {
  const clampedU = THREE.MathUtils.clamp(u, 0, 1);
  const clampedV = THREE.MathUtils.clamp(v, 0, 1);
  const x = clampedU * (atlas.width - 1);
  const y = clampedV * (atlas.height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(atlas.width - 1, x0 + 1);
  const y1 = Math.min(atlas.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const index = (ix: number, iy: number) => atlas.heightData[iy * atlas.width + ix] ?? 0;
  const h00 = index(x0, y0);
  const h10 = index(x1, y0);
  const h01 = index(x0, y1);
  const h11 = index(x1, y1);

  const hx0 = h00 * (1 - tx) + h10 * tx;
  const hx1 = h01 * (1 - tx) + h11 * tx;
  return hx0 * (1 - ty) + hx1 * ty;
}

export function terrainWorldRect() {
  const { minLng, maxLng, minLat, maxLat } = hongKongTerrainBounds;
  const widthMercator = maxLng - minLng;
  const top = mercatorY(maxLat);
  const bottom = mercatorY(minLat);
  const heightMercator = top - bottom;
  return { widthMercator, heightMercator, top, bottom };
}

export function terrainPointFromLngLat(
  lng: number,
  lat: number,
  worldWidth: number,
  worldDepth: number,
  atlas: TerrainAtlas,
  heightScale: number,
) {
  const { minLng, maxLng, minLat, maxLat } = hongKongTerrainBounds;
  const u = (lng - minLng) / (maxLng - minLng);
  const v = (mercatorY(maxLat) - mercatorY(lat)) / (mercatorY(maxLat) - mercatorY(minLat));
  const x = (u - 0.5) * worldWidth;
  const z = (0.5 - v) * worldDepth;
  const height = sampleTerrainHeight(atlas, u, v) * heightScale;
  return new THREE.Vector3(x, height, z);
}
