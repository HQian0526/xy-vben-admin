<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Refresh, Search } from '@element-plus/icons-vue';
import { useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import { getMallIncomeFlowApi, getStoreListApi } from '#/api';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const now = new Date();
const currentYear = String(now.getFullYear());
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const isLoading = ref(false);
const searched = ref(false);
const storeDict = ref<Array<{ label: string; value: string }>>([]);
const storeName = ref('');
const rows = ref<any[]>([]);
const summary = reactive({
  orderCount: 0,
  payAmount: '0.00',
  refundAmount: '0.00',
  netAmount: '0.00',
});

const query = reactive({
  storeId: '' as string,
  periodType: 'month',
  year: currentYear,
  yearFrom: String(now.getFullYear() - 4),
  yearTo: currentYear,
  month: currentMonth,
});

const periodOptions = computed(() => [
  { label: $t('global.orderFlow.year'), value: 'year' },
  { label: $t('global.orderFlow.quarter'), value: 'quarter' },
  { label: $t('global.orderFlow.month'), value: 'month' },
  { label: $t('global.orderFlow.day'), value: 'day' },
]);

function formatMoney(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function resetSummary() {
  summary.orderCount = 0;
  summary.payAmount = '0.00';
  summary.refundAmount = '0.00';
  summary.netAmount = '0.00';
  rows.value = [];
  storeName.value = '';
}

function buildParams() {
  const params: Record<string, any> = {
    periodType: query.periodType,
  };
  if (isAdmin.value) {
    params.storeId = query.storeId;
  }
  if (query.periodType === 'year') {
    params.yearFrom = Number(query.yearFrom);
    params.yearTo = Number(query.yearTo);
  } else if (query.periodType === 'day') {
    const parts = String(query.month || '').split('-');
    params.year = Number(parts[0] || currentYear);
    params.month = Number(parts[1] || now.getMonth() + 1);
  } else {
    params.year = Number(query.year);
  }
  return params;
}

async function loadStores() {
  if (!isAdmin.value) return;
  try {
    const res = await getStoreListApi({ pageSize: 9999, pageNum: 1, deleted: 0 });
    if (res.code === 200) {
      storeDict.value = (res.data?.list || []).map((item: any) => ({
        label: item.storeName,
        value: String(item.storeId),
      }));
    }
  } catch (error) {
    console.log(error);
  }
}

async function search() {
  if (isAdmin.value && !query.storeId) {
    ElMessage.warning($t('global.orderFlow.selectStore'));
    return;
  }
  isLoading.value = true;
  try {
    const res = await getMallIncomeFlowApi(buildParams());
    if (res.code === 200) {
      const data = res.data || {};
      searched.value = true;
      storeName.value = data.storeName || '';
      rows.value = data.list || [];
      summary.orderCount = Number(data.summary?.orderCount || 0);
      summary.payAmount = formatMoney(data.summary?.payAmount);
      summary.refundAmount = formatMoney(data.summary?.refundAmount);
      summary.netAmount = formatMoney(data.summary?.netAmount);
    } else {
      ElMessage.error(res.msg || $t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
}

function reset() {
  query.periodType = 'month';
  query.year = currentYear;
  query.yearFrom = String(now.getFullYear() - 4);
  query.yearTo = currentYear;
  query.month = currentMonth;
  if (isAdmin.value) {
    query.storeId = '';
    searched.value = false;
    resetSummary();
    return;
  }
  search();
}

onMounted(async () => {
  await loadStores();
  if (!isAdmin.value) {
    search();
  }
});
</script>

<template>
  <div v-loading="isLoading" class="order-flow-page pd5">
    <el-card class="filter-card">
      <el-form :inline="true" class="flow-form" @submit.prevent>
        <el-form-item v-if="isAdmin" :label="$t('global.orderFlow.storeName')">
          <el-select
            v-model="query.storeId"
            filterable
            clearable
            :placeholder="$t('global.orderFlow.selectStore')"
            style="width: 220px"
          >
            <el-option
              v-for="item in storeDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.orderFlow.periodType')">
          <el-radio-group v-model="query.periodType">
            <el-radio-button
              v-for="item in periodOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="query.periodType === 'year'">
          <el-form-item :label="$t('global.orderFlow.yearFrom')">
            <el-date-picker
              v-model="query.yearFrom"
              type="year"
              value-format="YYYY"
              :clearable="false"
              style="width: 120px"
            />
          </el-form-item>
          <el-form-item :label="$t('global.orderFlow.yearTo')">
            <el-date-picker
              v-model="query.yearTo"
              type="year"
              value-format="YYYY"
              :clearable="false"
              style="width: 120px"
            />
          </el-form-item>
        </template>
        <el-form-item
          v-else-if="query.periodType === 'day'"
          :label="$t('global.orderFlow.monthLabel')"
        >
          <el-date-picker
            v-model="query.month"
            type="month"
            value-format="YYYY-MM"
            :clearable="false"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item v-else :label="$t('global.orderFlow.yearLabel')">
          <el-date-picker
            v-model="query.year"
            type="year"
            value-format="YYYY"
            :clearable="false"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">
            {{ $t('global.btn.search') }}
          </el-button>
          <el-button type="primary" :icon="Refresh" @click="reset">
            {{ $t('global.btn.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="flow-tip">{{ $t('global.orderFlow.tip') }}</div>
    </el-card>

    <el-empty
      v-if="isAdmin && !searched"
      class="mgt20"
      :description="$t('global.orderFlow.emptyHint')"
    />

    <template v-else>
      <div class="summary-row mgt5">
        <el-card class="summary-card" shadow="never">
          <div class="summary-label">{{ $t('global.orderFlow.orderCount') }}</div>
          <div class="summary-value">{{ summary.orderCount }}</div>
        </el-card>
        <el-card class="summary-card" shadow="never">
          <div class="summary-label">{{ $t('global.orderFlow.payAmount') }}</div>
          <div class="summary-value">¥{{ summary.payAmount }}</div>
        </el-card>
        <el-card class="summary-card" shadow="never">
          <div class="summary-label">{{ $t('global.orderFlow.refundAmount') }}</div>
          <div class="summary-value summary-value--refund">
            ¥{{ summary.refundAmount }}
          </div>
        </el-card>
        <el-card class="summary-card" shadow="never">
          <div class="summary-label">{{ $t('global.orderFlow.netAmount') }}</div>
          <div class="summary-value summary-value--net">
            ¥{{ summary.netAmount }}
          </div>
        </el-card>
      </div>

      <el-card class="table-box mgt5">
        <div v-if="storeName" class="store-title">
          {{ storeName }}
        </div>
        <el-table :data="rows" border stripe height="100%">
          <el-table-column
            prop="periodLabel"
            :label="$t('global.orderFlow.period')"
            min-width="160"
          />
          <el-table-column
            prop="orderCount"
            :label="$t('global.orderFlow.orderCount')"
            width="120"
          />
          <el-table-column :label="$t('global.orderFlow.payAmount')" width="140">
            <template #default="{ row }">
              {{ formatMoney(row.payAmount) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('global.orderFlow.refundAmount')"
            width="140"
          >
            <template #default="{ row }">
              {{ formatMoney(row.refundAmount) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('global.orderFlow.netAmount')" width="140">
            <template #default="{ row }">
              {{ formatMoney(row.netAmount) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.order-flow-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.filter-card {
  flex-shrink: 0;
}

.flow-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.flow-tip {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}

.summary-card {
  :deep(.el-card__body) {
    padding: 16px 20px !important;
  }
}

.summary-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.summary-value--refund {
  color: var(--el-color-warning);
}

.summary-value--net {
  color: #00a896;
}

.store-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.table-box {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 360px;
  overflow: hidden;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
    padding-right: 20px !important;
    padding-bottom: 20px !important;
  }
}
</style>
