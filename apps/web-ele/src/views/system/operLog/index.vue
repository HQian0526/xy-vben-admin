<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

import { getOperLogListApi } from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const isLoading = ref(false);
//* *************table相关变量**************
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({}); // 缓存查询条件，供分页复用

/** 操作日志默认查询今天 */
const today = dayjs().format('YYYY-MM-DD');
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'id',
      label: $t('global.operLog.id'),
      width: '180px',
    },
    {
      prop: 'operModule',
      label: $t('global.operLog.operModule'),
    },
    {
      prop: 'operType',
      label: $t('global.operLog.operType'),
      filter: (value: any) => {
        const map: Record<number, string> = {
          1: $t('global.operLog.add'),
          2: $t('global.operLog.delete'),
          3: $t('global.operLog.update'),
          4: $t('global.operLog.query'),
        };
        return map[Number(value)] || value;
      },
    },
    {
      prop: 'operUser',
      label: $t('global.operLog.operUser'),
    },
    {
      prop: 'ipAddress',
      label: $t('global.operLog.ipAddress'),
    },
    {
      prop: 'ipLocation',
      label: $t('global.operLog.ipLocation'),
      width: '200px',
      filter: (value: any) => value || '—',
    },
    {
      prop: 'operResult',
      label: $t('global.operLog.operResult'),
      filter: (value: any) => {
        return Number(value) === 1
          ? $t('global.operLog.success')
          : Number(value) === 2
            ? $t('global.operLog.fail')
            : value;
      },
    },
    {
      prop: 'operTime',
      label: $t('global.operLog.operTime'),
      width: '180px',
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '110px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.viewRequest'),
          isShow: () => true,
        },
      ],
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
// 头部搜索框
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'operModule',
      label: $t('global.operLog.operModule'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.operLog.operModule')}`,
    },
    {
      type: 'input',
      prop: 'operUser',
      label: $t('global.operLog.operUser'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.operLog.operUser')}`,
    },
    {
      type: 'date',
      prop: 'operTime',
      label: $t('global.operLog.operTime'),
      value: today,
      valueFormat: 'YYYY-MM-DD',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.operLog.operTime')}`,
    },
  ],
});

// 首次进入 / 重置后默认带今天
searchParams.value = { operTime: today };

const search = (form: any) => {
  console.log('form', form);
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getOperLogList();
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item: any) => {
    item.value = null;
  });
  // 日期项重置回今天，其余清空
  const dateItem = formConfig.list.find(
    (item: any) => item.prop === 'operTime',
  );
  if (dateItem) {
    dateItem.value = today;
    form.operTime = today;
  }
  searchParams.value = { operTime: today };
  pageInfo.pageNum = 1;
  getOperLogList();
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getOperLogList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getOperLogList();
};

function formatOperDay(value: any) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 获取操作日志列表
const getOperLogList = async () => {
  const { operTime, ...rest } = searchParams.value;
  const day = formatOperDay(operTime);
  const obj: Record<string, any> = {
    ...rest,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  if (day) {
    obj.operTimeStart = `${day} 00:00:00`;
    obj.operTimeEnd = `${day} 23:59:59`;
  }
  try {
    isLoading.value = true;
    const res = await getOperLogListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...(res.data.list || [])); // 添加新数据
      total.value = res.data.total;
      isLoading.value = false;
    } else {
      isLoading.value = false;
      ElMessage({
        type: 'error',
        message: $t('global.message.searchError'),
      });
    }
  } catch (error) {
    isLoading.value = false;
    console.log(error);
  }
};

const detailVisible = ref(false);
const currentRow = ref<Record<string, any> | null>(null);

const hasPayload = computed(() => {
  const row = currentRow.value;
  if (!row) return false;
  return Boolean(row.requestMethod || row.requestUri || row.requestParams || row.responseBody);
});

const apiText = computed(() => {
  const row = currentRow.value;
  if (!row) return $t('global.operLog.emptyValue');
  const method = row.requestMethod || '';
  const uri = row.requestUri || '';
  const text = `${method} ${uri}`.trim();
  return text || $t('global.operLog.emptyValue');
});

const prettyParams = computed(() => formatPayload(currentRow.value?.requestParams));
const prettyResponse = computed(() => formatPayload(currentRow.value?.responseBody));

function formatPayload(raw: any) {
  if (raw == null || raw === '') {
    return $t('global.operLog.emptyValue');
  }
  if (typeof raw !== 'string') {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const handleClick = (row: any, label: string) => {
  if (label === $t('global.btn.viewRequest')) {
    currentRow.value = row;
    detailVisible.value = true;
  }
};

const closeDetailDialog = () => {
  detailVisible.value = false;
  currentRow.value = null;
};

onMounted(() => {
  getOperLogList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
    </el-card>
    <el-card class="table-box mgt5">
      <!-- 表格 -->
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handle-click="handleClick"
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog
      v-model="detailVisible"
      :title="$t('global.operLog.requestRecord')"
      width="760px"
      :append-to-body="true"
      :close-on-click-modal="false"
      @close="closeDetailDialog"
    >
      <div v-if="hasPayload" class="payload-box">
        <div class="payload-item">
          <div class="payload-label">{{ $t('global.operLog.requestApi') }}</div>
          <div class="payload-value">{{ apiText }}</div>
        </div>
        <div class="payload-item">
          <div class="payload-label">{{ $t('global.operLog.requestParams') }}</div>
          <pre class="payload-pre">{{ prettyParams }}</pre>
        </div>
        <div class="payload-item">
          <div class="payload-label">{{ $t('global.operLog.responseBody') }}</div>
          <pre class="payload-pre">{{ prettyResponse }}</pre>
        </div>
      </div>
      <div v-else class="payload-empty">
        {{ $t('global.operLog.noPayload') }}
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.payload-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payload-item {
  min-width: 0;
}

.payload-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.payload-value {
  word-break: break-all;
  font-size: 13px;
  line-height: 1.6;
}

.payload-pre {
  margin: 0;
  max-height: 280px;
  overflow: auto;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.payload-empty {
  padding: 32px 0;
  color: var(--el-text-color-secondary);
  text-align: center;
}
</style>
