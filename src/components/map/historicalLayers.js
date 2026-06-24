const layersBySceneId = {
  'prelude-1938': { category: 'guerrilla', kind: 'beacon' },
  'attack-1941-12-08': { category: 'enemy', kind: 'impact-zone', radius: 105 },
  'fall-1941-12-25': { category: 'enemy', kind: 'impact-zone', radius: 120 },
  'rescue-1942-01-08': {
    category: 'rescue',
    kind: 'route',
    path: [[114.17, 22.31], [114.21, 22.38], [114.28, 22.4]],
  },
  'rescue-1942-01-09': {
    category: 'rescue',
    kind: 'route',
    path: [[114.17, 22.31], [114.21, 22.38], [114.28, 22.4]],
  },
  'founding-1942-02-03': { category: 'guerrilla', kind: 'beacon' },
  'massacre-1942-09-25': { category: 'enemy', kind: 'impact-zone', radius: 80 },
  'station-1942-11': { category: 'guerrilla', kind: 'beacon' },
  'reorg-1943-12-02': { category: 'guerrilla', kind: 'beacon' },
  'kerr-1944-02-11': { category: 'enemy', kind: 'impact-zone', radius: 65 },
  'kerr-1944-03': {
    category: 'rescue',
    kind: 'route',
    path: [[114.16, 22.31], [114.25, 22.37], [114.3, 22.43]],
  },
  'bridge-1944-04-21': { category: 'enemy', kind: 'impact-zone', radius: 52 },
  'sea-1944-08-15': {
    category: 'sea',
    kind: 'route',
    path: [[114.17, 22.285], [114.23, 22.23], [114.28, 22.19]],
  },
  'surrender-1945-08-15': { category: 'guerrilla', kind: 'beacon' },
  'harcourt-1945-08-30': {
    category: 'sea',
    kind: 'route',
    path: [[114.16, 22.28], [114.18, 22.25], [114.21, 22.22]],
  },
  'surrender-1945-09-16': { category: 'guerrilla', kind: 'beacon' },
  'martyrs-1998-12-28': { category: 'guerrilla', kind: 'beacon' },
};

const fallbackLayer = { category: 'guerrilla', kind: 'beacon' };

export function getHistoricalLayer(sceneId) {
  return layersBySceneId[sceneId] ?? fallbackLayer;
}
