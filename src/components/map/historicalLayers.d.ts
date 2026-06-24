export type HistoricalLayerCategory = 'guerrilla' | 'enemy' | 'rescue' | 'sea';

export type HistoricalLayer = {
  category: HistoricalLayerCategory;
  kind: 'beacon' | 'impact-zone' | 'route';
  radius?: number;
  path?: [number, number][];
};

export function getHistoricalLayer(sceneId: string): HistoricalLayer;
