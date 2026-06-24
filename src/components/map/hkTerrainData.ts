import type { SceneFocus } from '../../data/hkHistory';

export type TerrainSceneMarker = {
  id: string;
  focus: SceneFocus;
  date: string;
  title: string;
  detail: string;
  label: string;
  coord: [number, number];
  emphasis?: boolean;
  fire?: boolean;
};

export type TerrainPlaceLabel = {
  label: string;
  coord: [number, number];
  category: 'city' | 'sea' | 'ridge' | 'route';
  highlight?: boolean;
};

export const hongKongTerrainBounds = {
  minLng: 113.88,
  maxLng: 114.32,
  minLat: 22.16,
  maxLat: 22.57,
  zoom: 13,
} as const;

export const hongKongTerrainMarkerOrder: TerrainSceneMarker[] = [
  {
    id: 'prelude-1938',
    focus: 'newTerritories',
    date: '1938.10.21',
    title: '邊境緊張升溫',
    detail: '新界北、口岸與交通線開始串聯。',
    label: '新界北',
    coord: [114.09, 22.52],
    emphasis: true,
  },
  {
    id: 'attack-1941-12-08',
    focus: 'kaiTak',
    date: '1941.12.08',
    title: '日軍攻擊香港',
    detail: '啟德、港口與防線同時受壓。',
    label: '啟德機場',
    coord: [114.19, 22.31],
    emphasis: true,
    fire: true,
  },
  {
    id: 'fall-1941-12-25',
    focus: 'harbour',
    date: '1941.12.25',
    title: '香港淪陷',
    detail: '港島與九龍進入日軍管治。',
    label: '維多利亞港',
    coord: [114.17, 22.285],
    emphasis: true,
    fire: true,
  },
  {
    id: 'rescue-1942-01-08',
    focus: 'rescue',
    date: '1942.01.08',
    title: '秘密大營救啟動',
    detail: '由市區連接到新界與華南根據地。',
    label: '油尖旺線',
    coord: [114.17, 22.31],
    fire: true,
  },
  {
    id: 'rescue-1942-01-09',
    focus: 'rescue',
    date: '1942.01.09',
    title: '接應與轉移',
    detail: '多個村落、船路與市區據點組成地下轉移網絡。',
    label: '地下交通網絡',
    coord: [114.21, 22.38],
  },
  {
    id: 'founding-1942-02-03',
    focus: 'wongMoYing',
    date: '1942.02.03',
    title: '港九大隊成軍',
    detail: '黃毛應村成為敵後武裝據點。',
    label: '黃毛應村',
    coord: [114.28, 22.40],
    emphasis: true,
  },
  {
    id: 'massacre-1942-09-25',
    focus: 'wuGauTang',
    date: '1942.09.25',
    title: '烏蛟騰慘案',
    detail: '村民支援抗戰後遭到報復。',
    label: '烏蛟騰',
    coord: [114.18, 22.45],
    emphasis: true,
    fire: true,
  },
  {
    id: 'station-1942-11',
    focus: 'newTerritories',
    date: '1942.11',
    title: '交通站擴展',
    detail: '新界村落與聯絡站開始加密。',
    label: '新界中樞',
    coord: [114.12, 22.48],
  },
  {
    id: 'reorg-1943-12-02',
    focus: 'newTerritories',
    date: '1943.12.02',
    title: '敵後網絡重整',
    detail: '港九大隊與游擊網絡重新編組。',
    label: '新界北路',
    coord: [114.16, 22.42],
    fire: true,
  },
  {
    id: 'kerr-1944-02-11',
    focus: 'kerr',
    date: '1944.02.11',
    title: '克爾事件',
    detail: '盟軍飛行員在香港上空被擊落。',
    label: '港島上空',
    coord: [114.16, 22.31],
    emphasis: true,
    fire: true,
  },
  {
    id: 'kerr-1944-03',
    focus: 'kerr',
    date: '1944.02-1944.03',
    title: '營救與匿藏',
    detail: '飛行員經山徑與村落向外轉送。',
    label: '西貢山徑',
    coord: [114.25, 22.37],
  },
  {
    id: 'bridge-1944-04-21',
    focus: 'kaiTak',
    date: '1944.04.21',
    title: '破壞鐵路橋樑',
    detail: '九龍交通線遭到游擊打擊。',
    label: '九龍城',
    coord: [114.19, 22.33],
    fire: true,
  },
  {
    id: 'sea-1944-08-15',
    focus: 'sea',
    date: '1944.08.15',
    title: '海上中隊行動',
    detail: '海域同樣成為敵後戰場。',
    label: '南海航道',
    coord: [114.28, 22.19],
    emphasis: true,
  },
  {
    id: 'surrender-1945-08-15',
    focus: 'postwar',
    date: '1945.08.15',
    title: '日本投降',
    detail: '香港敵後抗戰迎來終結。',
    label: '港島',
    coord: [114.17, 22.29],
    emphasis: true,
  },
  {
    id: 'harcourt-1945-08-30',
    focus: 'harbour',
    date: '1945.08.30',
    title: '夏慤艦隊入港',
    detail: '盟軍重新接收香港。',
    label: '維港接收',
    coord: [114.16, 22.28],
    fire: true,
  },
  {
    id: 'surrender-1945-09-16',
    focus: 'postwar',
    date: '1945.09.16',
    title: '戰後正式交接',
    detail: '香港脫離日軍控制。',
    label: '戰後接管',
    coord: [114.18, 22.29],
  },
  {
    id: 'martyrs-1998-12-28',
    focus: 'postwar',
    date: '1998.12.28',
    title: '烈士名冊安放',
    detail: '歷史記憶回到公共視野。',
    label: '中西區',
    coord: [114.15, 22.28],
    emphasis: true,
  },
];

export const hongKongTerrainPlaceLabels: TerrainPlaceLabel[] = [
  { label: '新界', coord: [114.13, 22.46], category: 'city', highlight: true },
  { label: '九龍', coord: [114.18, 22.32], category: 'city', highlight: true },
  { label: '港島', coord: [114.16, 22.27], category: 'city', highlight: true },
  { label: '西貢', coord: [114.28, 22.40], category: 'city' },
  { label: '沙田', coord: [114.21, 22.38], category: 'city' },
  { label: '元朗', coord: [114.03, 22.44], category: 'city' },
  { label: '大埔', coord: [114.17, 22.47], category: 'city' },
  { label: '啟德', coord: [114.21, 22.31], category: 'route', highlight: true },
  { label: '維多利亞港', coord: [114.17, 22.285], category: 'sea', highlight: true },
  { label: '新界山脈', coord: [114.22, 22.49], category: 'ridge' },
];

export function getHongKongTerrainMarkerBySceneKey(sceneKey: string) {
  return hongKongTerrainMarkerOrder.find((marker) => marker.id === sceneKey)
    ?? hongKongTerrainMarkerOrder[0];
}
