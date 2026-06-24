<template>
  <main class="page">
    <section class="hero-shell" id="sceneRoot" :data-tone="activeScene.tone">
      <header class="masthead panel">
        <p class="eyebrow">HONG KONG · 1941-1945</p>
        <h1>港九大隊</h1>
        <p class="masthead-subhead">THE HONG KONG-KOWLOON BRIGADE</p>
        <div class="masthead-actions">
          <button class="compact-action" type="button" @click="autoplay = !autoplay">
            自動導覽：{{ autoplay ? '開' : '關' }}
          </button>
          <button class="compact-action secondary" type="button" @click="notesOpen = true">資料來源</button>
        </div>
      </header>

      <aside class="legend-shell" id="key" aria-label="圖例">
        <button
          class="legend-toggle panel"
          type="button"
          :aria-expanded="legendOpen"
          aria-controls="legendContent"
          @click="legendOpen = !legendOpen"
        >
          <span>圖例</span>
          <small>{{ legendOpen ? '收起' : '查看' }}</small>
        </button>
        <div v-if="legendOpen" id="legendContent" class="legend-card panel">
          <div class="key-title">
            <span class="eyebrow">KEY</span>
            <strong>圖例 / LEGEND</strong>
          </div>
          <div class="key-list">
            <div class="row"><span class="sw guerrilla"></span><span>游擊據點／行動點</span></div>
            <div class="row"><span class="sw enemy"></span><span>戰事事件影響範圍（示意）</span></div>
            <div class="row"><span class="sw rescue"></span><span>營救與聯絡線（示意）</span></div>
            <div class="row"><span class="sw sea"></span><span>海上行動航線（示意）</span></div>
          </div>
          <p class="key-note">地形為現代實測高程與衛星底圖；歷史圖層按已記錄事件座標重建。</p>
        </div>
      </aside>

      <div class="map-stage panel" id="mapStage" aria-label="港九大隊 3D 地圖">
        <HongKongThreeMap
          :scene-key="activeScene.id"
          :scene-focus="activeScene.focus"
          :scene-title="activeScene.title"
          :scene-date="activeScene.date"
        />
      </div>

      <aside class="caption panel" id="caption" aria-live="polite">
        <div class="caption-head">
          <div>
            <p class="eyebrow">DIRECTOR</p>
            <h2 id="sceneTitle">{{ activeScene.title }}</h2>
            <p class="scene-subtitle" id="sceneSubtitle">{{ activeScene.subtitle }}</p>
          </div>
          <div class="scene-date" id="sceneDate">{{ activeScene.date }}</div>
        </div>
        <p class="scene-location" id="sceneLocation">{{ activeScene.location }}</p>
        <p class="scene-body" id="sceneBody">{{ activeScene.body }}</p>
        <ul class="scene-stats" id="sceneStats">
          <li v-for="[label, value] in activeScene.highlights" :key="label">
            <strong>{{ label }}</strong>
            <span>{{ value }}</span>
          </li>
        </ul>
      </aside>

      <div class="controls panel" id="controls">
        <button class="icon-btn" type="button" id="prevScene" aria-label="上一幕" @click="prevScene">←</button>
        <button class="icon-btn play" type="button" id="playHead" aria-label="播放或暫停" @click="togglePlay">
          {{ autoplay ? 'Ⅱ' : '▶' }}
        </button>
        <button class="icon-btn" type="button" id="nextScene" aria-label="下一幕" @click="nextScene">→</button>
        <div class="progress-wrap">
          <div class="progress" id="progressBar" role="progressbar" aria-label="場景進度" :style="{ width: progressWidth }"></div>
        </div>
        <div class="scene-label" id="sceneLabel">
          {{ sceneIndexLabel }}
        </div>
      </div>

    </section>

    <section class="timeline-dock panel" aria-label="時間線">
      <div class="timeline-head">
        <span class="eyebrow">TIMELINE</span>
        <strong>港九大隊 / 敵後史</strong>
      </div>
      <div class="timeline" id="timeline">
        <button
          v-for="(scene, index) in scenes"
          :key="scene.id"
          type="button"
          class="timeline-btn"
          :class="{ 'is-active': index === activeIndex }"
          @click="goToScene(index)"
        >
          <span class="date">{{ scene.date }}</span>
          <span class="title">{{ scene.title }}</span>
          <span class="desc">{{ scene.location }}</span>
        </button>
      </div>
    </section>

    <aside class="notes panel" :class="{ 'is-open': notesOpen }" id="notesPanel" :aria-hidden="!notesOpen">
      <div class="notes-head">
        <p class="eyebrow">NOTES &amp; SOURCES</p>
        <button id="closeNotes" type="button" aria-label="關閉資料來源" @click="notesOpen = false">×</button>
      </div>
      <div class="notes-body" id="notesBody">
        <h3>資料來源</h3>
        <div class="notes-grid">
          <ul class="notes-list">
            <li v-for="source in leftSources" :key="source[0]">
              <a :href="source[1].url" target="_blank" rel="noreferrer">{{ source[1].label }}</a>
              <small>{{ source[1].url }}</small>
            </li>
          </ul>
          <ul class="notes-list">
            <li v-for="source in rightSources" :key="source[0]">
              <a :href="source[1].url" target="_blank" rel="noreferrer">{{ source[1].label }}</a>
              <small>{{ source[1].url }}</small>
            </li>
          </ul>
        </div>
        <p class="notes-foot">
          本站以香港政府開放數據地區邊界作為地圖底層，並以港九大隊、東江縱隊與本地抗戰研究資料補充歷史敘事。
        </p>
      </div>
    </aside>

    <div class="boot" id="boot" aria-hidden="true" :class="{ 'is-hidden': bootHidden }">
      <div class="boot-title">
        <p>港九大隊</p>
        <span>THE HONG KONG-KOWLOON BRIGADE</span>
      </div>
      <div class="boot-bar"><i></i></div>
      <p id="bootMsg">載入香港行政區 GeoJSON 與 3D 戰場場景…</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import HongKongThreeMap from './components/map/HongKongTerrainMap.vue';
import { scenes, sourceCatalog } from './data/hkHistory';

const activeIndex = ref(0);
const autoplay = ref(true);
const legendOpen = ref(false);
const notesOpen = ref(false);
const bootHidden = ref(false);
let timer: number | undefined;
let bootTimer: number | undefined;

const activeScene = computed(() => scenes[activeIndex.value]);
const sceneIndexLabel = computed(() => `${String(activeIndex.value + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`);
const progressWidth = computed(() => `${((activeIndex.value + 1) / scenes.length) * 100}%`);

const sourceEntries = Object.entries(sourceCatalog);
const midpoint = Math.ceil(sourceEntries.length / 2);
const leftSources = computed(() => sourceEntries.slice(0, midpoint));
const rightSources = computed(() => sourceEntries.slice(midpoint));

function goToScene(index: number) {
  activeIndex.value = (index + scenes.length) % scenes.length;
  document.title = `${scenes[activeIndex.value].title} · 港九大隊`;
}

function nextScene() {
  goToScene(activeIndex.value + 1);
}

function prevScene() {
  goToScene(activeIndex.value - 1);
}

function togglePlay() {
  autoplay.value = !autoplay.value;
}

function syncTitle() {
  document.title = `${activeScene.value.title} · 港九大隊`;
}

onMounted(() => {
  syncTitle();
  bootTimer = window.setTimeout(() => {
    bootHidden.value = true;
  }, 900);
  timer = window.setInterval(() => {
    if (autoplay.value) nextScene();
  }, 11000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  if (bootTimer) window.clearTimeout(bootTimer);
});
</script>
