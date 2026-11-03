<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '#/locales';

const props = defineProps<{
  data: {
    contractName?: string;
    contentSnapshot?: string;
    contractStatus?: number;
    partyAName?: string;
    partyBName?: string;
    partyASealImage?: string;
    partyBSignImage?: string;
    partyASignTime?: string;
    partyBSignTime?: string;
  };
}>();

const TITLE_RE = /软件系统交付与技术服务合同/;
const ARTICLE_RE = /^第[一二三四五六七八九十百零0-9]+条/;
const FOOTER_RE =
  /^(甲方（盖章）|乙方（盖章\s*[／/]\s*签字）|乙方（签字）|签署日期)[：:]/;

function stripSignFooter(body: string) {
  const lines = body.replace(/\s+$/, '').split('\n');
  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (!last || FOOTER_RE.test(last)) {
      lines.pop();
      continue;
    }
    break;
  }
  return lines.join('\n').replace(/\s+$/, '');
}

const parsed = computed(() => {
  const lines = String(props.data.contentSnapshot || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i += 1;
  if (i < lines.length && TITLE_RE.test(lines[i].trim())) i += 1;

  const preamble: Array<{ label: string; value: string }> = [];
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    if (ARTICLE_RE.test(trimmed)) break;
    const match = trimmed.match(/^(.+?)[：:]\s*(.*)$/);
    if (!match) break;
    preamble.push({ label: match[1].trim(), value: match[2] ?? '' });
    i += 1;
  }

  return {
    preamble,
    body: stripSignFooter(lines.slice(i).join('\n').replace(/^\n+/, '')),
  };
});

const watermark = computed(() => {
  const status = Number(props.data.contractStatus);
  if (status === 0) return $t('global.contract.statusDraft');
  if (status === 3) return $t('global.contract.statusVoid');
  return '';
});
</script>

<template>
  <div class="print-sheet">
    <div v-if="watermark" class="watermark">{{ watermark }}</div>
    <h1 class="print-title">{{ data.contractName || $t('global.contract.contractName') }}</h1>
    <div v-if="parsed.preamble.length" class="print-parties">
      <div v-for="(item, index) in parsed.preamble" :key="`${item.label}-${index}`" class="print-party-item">
        <span class="print-party-label">{{ item.label }}：</span>
        <span>{{ item.value }}</span>
      </div>
    </div>
    <div class="print-body">{{ parsed.body }}</div>
    <div class="print-sign">
      <div class="print-sign-col print-sign-a">
        <div class="print-sign-label">{{ $t('global.contract.partyASeal') }}</div>
        <div class="print-sign-name">{{ data.partyAName || '________________' }}</div>
        <img
          v-if="data.partyASealImage"
          class="print-seal-img"
          :src="data.partyASealImage"
          alt=""
        />
        <div v-if="data.partyASignTime" class="print-sign-time">
          {{ $t('global.contract.signTime') }}：{{ data.partyASignTime }}
        </div>
      </div>
      <div class="print-sign-col">
        <div class="print-sign-label">{{ $t('global.contract.partyBSign') }}</div>
        <img
          v-if="data.partyBSignImage"
          class="print-sign-img"
          :src="data.partyBSignImage"
          alt=""
        />
        <div v-if="data.partyBSignTime" class="print-sign-time">
          {{ $t('global.contract.signTime') }}：{{ data.partyBSignTime }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.print-sheet {
  position: relative;
  box-sizing: border-box;
  padding: 24px 28px 32px;
  color: #111;
  background: #fff;
  overflow: visible;
}

.watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 96px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.08);
  letter-spacing: 12px;
  transform: rotate(-24deg);
  pointer-events: none;
  z-index: 0;
}

.print-title,
.print-parties,
.print-body,
.print-sign {
  position: relative;
  z-index: 1;
}

.print-title {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  line-height: 1.4;
}

.print-parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 32px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.7;
}

.print-party-item {
  min-width: 0;
  word-break: break-word;
}

.print-party-label {
  color: #333;
}

.print-body {
  min-height: 240px;
  margin-bottom: 28px;
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}

.print-sign {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  overflow: visible;
  page-break-inside: avoid;
  break-inside: avoid;
}

.print-sign-col {
  position: relative;
  min-height: 120px;
}

.print-sign-a {
  padding-bottom: 12px;
}

.print-seal-img {
  position: absolute;
  left: 28px;
  top: 0;
  width: 132px;
  height: 132px;
  object-fit: contain;
  pointer-events: none;
  transform: rotate(-12deg);
  mix-blend-mode: multiply;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.print-sign-label {
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.print-sign-name {
  font-size: 15px;
  font-weight: 600;
}

.print-sign-img {
  display: block;
  width: 200px;
  height: 88px;
  margin-top: 8px;
  object-fit: contain;
  background: #fff;
}

.print-sign-time {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>
