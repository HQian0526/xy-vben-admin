<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { getDashboardOverviewApi } from '#/api';

interface Overview {
  storeId?: string;
  storeName?: string;
  identityType?: number;
  today?: string;
  todaySales?: number;
  yesterdaySales?: number;
  todaySalesRate?: number;
  todayOrderCount?: number;
  yesterdayOrderCount?: number;
  todayOrderRate?: number;
  monthSales?: number;
  lastMonthSales?: number;
  monthSalesRate?: number;
  monthOrderCount?: number;
  todayCustomers?: number;
  yesterdayCustomers?: number;
  todayCustomerRate?: number;
  todayNewCustomers?: number;
  yesterdayNewCustomers?: number;
  todayNewCustomerRate?: number;
  todayRecharge?: number;
  yesterdayRecharge?: number;
  todayRechargeRate?: number;
  todayRefund?: number;
  trend?: Array<{
    customers?: number;
    day?: string;
    newCustomers?: number;
    orderCount?: number;
    sales?: number;
  }>;
  hourSales?: Array<{ hour?: string; orderCount?: number; sales?: number }>;
  payChannels?: Array<{
    amount?: number;
    channelName?: string;
    orderCount?: number;
  }>;
  topStores?: Array<{
    orderCount?: number;
    sales?: number;
    storeName?: string;
  }>;
}

const userStore = useUserStore();
const loading = ref(false);
const overview = ref<Overview>({});

const trendRef = ref<EchartsUIType>();
const hourRef = ref<EchartsUIType>();
const channelRef = ref<EchartsUIType>();
const rankRef = ref<EchartsUIType>();
const { renderEcharts: renderTrend } = useEcharts(trendRef);
const { renderEcharts: renderHour } = useEcharts(hourRef);
const { renderEcharts: renderChannel } = useEcharts(channelRef);
const { renderEcharts: renderRank } = useEcharts(rankRef);

const isAdmin = computed(() => Number(overview.value.identityType) === 3);
const realName = computed(
  () =>
    userStore.userInfo?.realName ||
    userStore.userInfo?.userName ||
    userStore.userInfo?.username ||
    '',
);
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 13) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});
const heroTitle = computed(() => {
  if (overview.value.storeName) {
    return overview.value.storeName;
  }
  return isAdmin.value ? '全平台经营概览' : '经营概览';
});

const kpis = computed(() => [
  {
    key: 'todaySales',
    label: '今日销售额',
    value: money(overview.value.todaySales),
    prefix: '¥',
    compare: `昨日 ¥${money(overview.value.yesterdaySales)}`,
    rate: Number(overview.value.todaySalesRate || 0),
    tone: 'teal',
  },
  {
    key: 'monthSales',
    label: '本月累计',
    value: money(overview.value.monthSales),
    prefix: '¥',
    compare: `上月同期 ¥${money(overview.value.lastMonthSales)}`,
    rate: Number(overview.value.monthSalesRate || 0),
    tone: 'cyan',
  },
  {
    key: 'todayOrders',
    label: '今日订单',
    value: String(overview.value.todayOrderCount || 0),
    prefix: '',
    compare: `昨日 ${overview.value.yesterdayOrderCount || 0} 单`,
    rate: Number(overview.value.todayOrderRate || 0),
    tone: 'indigo',
  },
  {
    key: 'todayCustomers',
    label: '今日顾客',
    value: String(overview.value.todayCustomers || 0),
    prefix: '',
    compare: `昨日 ${overview.value.yesterdayCustomers || 0} 人`,
    rate: Number(overview.value.todayCustomerRate || 0),
    tone: 'amber',
  },
  {
    key: 'todayNew',
    label: '今日新客',
    value: String(overview.value.todayNewCustomers || 0),
    prefix: '',
    compare: `昨日 ${overview.value.yesterdayNewCustomers || 0} 人`,
    rate: Number(overview.value.todayNewCustomerRate || 0),
    tone: 'rose',
  },
  {
    key: 'todayRecharge',
    label: '今日储值',
    value: money(overview.value.todayRecharge),
    prefix: '¥',
    compare: `昨日 ¥${money(overview.value.yesterdayRecharge)}`,
    rate: Number(overview.value.todayRechargeRate || 0),
    tone: 'slate',
  },
]);

function money(value: null | number | string | undefined) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) {
    return '0.00';
  }
  return n.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function unwrap(res: any) {
  if (res && typeof res === 'object' && 'code' in res) {
    return res.data || {};
  }
  return res || {};
}

function formatRate(rate: number) {
  const n = Number(rate || 0);
  const abs = Math.abs(n).toFixed(1);
  if (n > 0) return `+${abs}%`;
  if (n < 0) return `-${abs}%`;
  return '0.0%';
}

async function loadOverview() {
  loading.value = true;
  try {
    const res = await getDashboardOverviewApi();
    overview.value = unwrap(res);
  } catch (error) {
    console.error(error);
    ElMessage.error('经营数据加载失败');
  } finally {
    loading.value = false;
  }
  await nextTick();
  renderCharts();
}

function renderCharts() {
  const trend = overview.value.trend || [];
  const hours = overview.value.hourSales || [];
  const channels = overview.value.payChannels || [];
  const stores = overview.value.topStores || [];

  renderTrend({
    color: ['#0f766e', '#6366f1', '#f59e0b'],
    grid: { bottom: 8, containLabel: true, left: 12, right: 16, top: 36 },
    legend: { data: ['销售额', '订单数', '顾客数'], top: 0 },
    series: [
      {
        areaStyle: { color: 'rgba(15,118,110,0.12)' },
        data: trend.map((item) => Number(item.sales || 0)),
        name: '销售额',
        smooth: true,
        type: 'line',
        yAxisIndex: 0,
      },
      {
        data: trend.map((item) => Number(item.orderCount || 0)),
        name: '订单数',
        smooth: true,
        type: 'line',
        yAxisIndex: 1,
      },
      {
        data: trend.map((item) => Number(item.customers || 0)),
        name: '顾客数',
        smooth: true,
        type: 'line',
        yAxisIndex: 1,
      },
    ],
    tooltip: { trigger: 'axis' },
    xAxis: {
      boundaryGap: false,
      data: trend.map((item) => String(item.day || '').slice(5)),
      type: 'category',
    },
    yAxis: [
      { name: '元', splitLine: { lineStyle: { type: 'dashed' } }, type: 'value' },
      { name: '笔 / 人', splitLine: { show: false }, type: 'value' },
    ],
  });

  renderHour({
    color: ['#0ea5a4'],
    grid: { bottom: 8, containLabel: true, left: 12, right: 8, top: 28 },
    series: [
      {
        barMaxWidth: 18,
        data: hours.map((item) => Number(item.sales || 0)),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            colorStops: [
              { color: '#14b8a6', offset: 0 },
              { color: '#0f766e', offset: 1 },
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1,
          },
        },
        name: '销售额',
        type: 'bar',
      },
    ],
    tooltip: {
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params;
        const hour = hours[item?.dataIndex] || {};
        return `${item?.name}<br/>销售额 ¥${money(item?.value)}<br/>订单 ${hour.orderCount || 0} 笔`;
      },
      trigger: 'axis',
    },
    xAxis: {
      data: hours.map((item) => `${Number(item.hour || 0)}时`),
      type: 'category',
    },
    yAxis: {
      splitLine: { lineStyle: { type: 'dashed' } },
      type: 'value',
    },
  });

  if (channels.length) {
    const channelData = channels.map((item) => ({
      name: item.channelName || '其他',
      value: Number(item.amount || 0),
    }));
    renderChannel({
      color: ['#0f766e', '#6366f1', '#f59e0b', '#94a3b8'],
      legend: { bottom: 0 },
      series: [
        {
          avoidLabelOverlap: true,
          data: channelData,
          emphasis: { scale: true },
          itemStyle: { borderColor: '#fff', borderRadius: 8, borderWidth: 2 },
          label: { formatter: '{b}\n{d}%', fontSize: 12 },
          name: '支付构成',
          radius: ['42%', '68%'],
          type: 'pie',
        },
      ],
      tooltip: {
        formatter: (item: any) =>
          `${item.name}<br/>¥${money(item.value)}（${item.percent}%）`,
        trigger: 'item',
      },
    });
  }

  if (isAdmin.value && stores.length) {
    const rank = [...stores].reverse();
    renderRank({
      color: ['#0f766e'],
      grid: { bottom: 8, containLabel: true, left: 8, right: 24, top: 8 },
      series: [
        {
          data: rank.map((item) => Number(item.sales || 0)),
          itemStyle: { borderRadius: [0, 8, 8, 0] },
          name: '销售额',
          type: 'bar',
        },
      ],
      tooltip: {
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          const row = rank[item?.dataIndex] || {};
          return `${item?.name}<br/>¥${money(item?.value)} · ${row.orderCount || 0} 单`;
        },
        trigger: 'axis',
      },
      xAxis: {
        splitLine: { lineStyle: { type: 'dashed' } },
        type: 'value',
      },
      yAxis: {
        data: rank.map((item) => item.storeName || '未命名'),
        type: 'category',
      },
    });
  }
}

onMounted(() => {
  loadOverview();
});

watch(
  () => userStore.userInfo?.lastStoreId,
  (next, prev) => {
    if (next && prev && String(next) !== String(prev)) {
      loadOverview();
    }
  },
);
</script>

<template>
  <div v-loading="loading" class="dash">
    <section class="hero">
      <div>
        <p class="hello">{{ greeting }}{{ realName ? `，${realName}` : '' }}</p>
        <h1 class="title">{{ heroTitle }}</h1>
        <p class="sub">
          {{ overview.today || '' }} · 销售额仅统计微信/余额实收（已扣退款，不含预定单）
          <span v-if="Number(overview.todayRefund || 0) > 0">
            · 今日退款 ¥{{ money(overview.todayRefund) }}
          </span>
        </p>
      </div>
      <button class="refresh" type="button" @click="loadOverview">刷新数据</button>
    </section>

    <section class="kpi-grid">
      <article v-for="item in kpis" :key="item.key" class="kpi" :class="`kpi--${item.tone}`">
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">
          <span v-if="item.prefix" class="kpi-prefix">{{ item.prefix }}</span>
          {{ item.value }}
        </div>
        <div class="kpi-foot">
          <span class="kpi-compare">{{ item.compare }}</span>
          <span class="kpi-rate" :class="item.rate >= 0 ? 'is-up' : 'is-down'">
            {{ formatRate(item.rate) }}
          </span>
        </div>
      </article>
    </section>

    <section class="chart-grid">
      <article class="panel">
        <div class="panel-head">
          <h2>近 14 天趋势</h2>
          <span>销售额 / 订单 / 顾客</span>
        </div>
        <EchartsUI ref="trendRef" height="320px" />
      </article>
      <article class="panel">
        <div class="panel-head">
          <h2>今日支付构成</h2>
          <span>按净额</span>
        </div>
        <EchartsUI
          v-if="(overview.payChannels || []).length"
          ref="channelRef"
          height="320px"
        />
        <div v-else class="empty">今日暂无成交</div>
      </article>
    </section>

    <section class="chart-grid">
      <article class="panel" :class="{ 'panel--wide': !isAdmin }">
        <div class="panel-head">
          <h2>今日分时销售</h2>
          <span>按支付时间</span>
        </div>
        <EchartsUI ref="hourRef" height="300px" />
      </article>
      <article v-if="isAdmin" class="panel">
        <div class="panel-head">
          <h2>今日门店排行</h2>
          <span>前 5 名</span>
        </div>
        <EchartsUI
          v-if="(overview.topStores || []).length"
          ref="rankRef"
          height="300px"
        />
        <div v-else class="empty">今日暂无门店成交</div>
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dash {
  min-height: calc(100vh - 120px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background:
    radial-gradient(900px 280px at 0% -10%, rgb(15 118 110 / 10%), transparent 55%),
    radial-gradient(700px 240px at 100% 0%, rgb(99 102 241 / 8%), transparent 50%),
    #f5f7fa;
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #0f766e 0%, #0e7490 58%, #155e75 100%);
  box-shadow: 0 12px 28px rgb(15 118 110 / 18%);
}

.hello {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.title {
  margin: 6px 0 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.sub {
  margin: 8px 0 0;
  font-size: 13px;
  opacity: 0.88;
}

.refresh {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 999px;
  background: rgb(255 255 255 / 12%);
  color: #fff;
  cursor: pointer;
}

.refresh:hover {
  background: rgb(255 255 255 / 22%);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.kpi {
  padding: 16px 16px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e8eef2;
  box-shadow: 0 6px 16px rgb(15 23 42 / 4%);
}

.kpi-label {
  color: #64748b;
  font-size: 13px;
}

.kpi-value {
  margin-top: 10px;
  color: #0f172a;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.4px;
}

.kpi-prefix {
  margin-right: 2px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.kpi-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.kpi-compare {
  color: #94a3b8;
  font-size: 12px;
}

.kpi-rate {
  font-size: 12px;
  font-weight: 650;
}

.kpi-rate.is-up {
  color: #16a34a;
}

.kpi-rate.is-down {
  color: #e11d48;
}

.kpi--teal {
  border-top: 3px solid #0f766e;
}
.kpi--cyan {
  border-top: 3px solid #0ea5a4;
}
.kpi--indigo {
  border-top: 3px solid #6366f1;
}
.kpi--amber {
  border-top: 3px solid #f59e0b;
}
.kpi--rose {
  border-top: 3px solid #f43f5e;
}
.kpi--slate {
  border-top: 3px solid #64748b;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 12px;
}

.panel {
  padding: 16px 16px 8px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e8eef2;
}

.panel--wide {
  grid-column: 1 / -1;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
}

.panel-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: #0f172a;
}

.panel-head span {
  color: #94a3b8;
  font-size: 12px;
}

.empty {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .dash {
    padding: 12px;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }

  .title {
    font-size: 22px;
  }
}
</style>
