<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import { getMallFinanceLedgerApi, getStoreListApi } from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const isLoading = ref(false);
const total = ref(0);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({});
const storeDict = reactive<Array<{ label: string; value: any }>>([]);

const tableConfig = reactive({
  list: [
    {
      prop: 'time',
      label: $t('global.financeLedger.time'),
      width: '180px',
    },
    {
      prop: 'type',
      label: $t('global.financeLedger.type'),
      width: '100px',
      filter: (value: any) => {
        return value === 'expense'
          ? $t('global.financeLedger.expense')
          : $t('global.financeLedger.income');
      },
    },
    {
      prop: 'orderNo',
      label: $t('global.financeLedger.orderNo'),
      width: '200px',
    },
    {
      prop: 'amount',
      label: $t('global.financeLedger.amount'),
      width: '120px',
      filter: (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n.toFixed(2) : '0.00';
      },
    },
    {
      prop: 'status',
      label: $t('global.financeLedger.status'),
      width: '120px',
    },
    {
      prop: 'storeName',
      label: $t('global.financeLedger.storeName'),
    },
  ],
});
const list = reactive([]);

const formConfig = reactive({
  list: [
    {
      type: 'date',
      prop: 'date',
      label: $t('global.financeLedger.date'),
      value: '',
      placeholder: $t('global.financeLedger.selectDate'),
    },
  ] as Array<Record<string, any>>,
});

function formatDay(value: any) {
  if (!value) return undefined;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const search = (form: any) => {
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getLedgerList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  if (isAdmin.value) {
    list.length = 0;
    total.value = 0;
    return;
  }
  getLedgerList();
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getLedgerList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  pageInfo.pageNum = 1;
  getLedgerList();
};

const getStoreList = async () => {
  try {
    const res = await getStoreListApi({ pageSize: 9999, pageNum: 1, deleted: 0 });
    if (res.code === 200) {
      storeDict.splice(
        0,
        storeDict.length,
        ...(res.data.list || []).map((item: any) => ({
          label: item.storeName,
          value: String(item.storeId),
        })),
      );
    }
  } catch (error) {
    console.log(error);
  }
};

const getLedgerList = async () => {
  const params: Record<string, any> = {
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  const date = formatDay(searchParams.value.date);
  if (date) {
    params.date = date;
  }
  if (isAdmin.value) {
    if (!searchParams.value.storeId) {
      ElMessage.warning($t('global.financeLedger.selectStore'));
      list.length = 0;
      total.value = 0;
      return;
    }
    params.storeId = searchParams.value.storeId;
  } else {
    delete params.storeId;
  }
  try {
    isLoading.value = true;
    const res = await getMallFinanceLedgerApi(params);
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data.list || []));
      total.value = res.data.total || 0;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || $t('global.message.searchError'),
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.unshift({
      type: 'select',
      prop: 'storeId',
      label: $t('global.financeLedger.storeName'),
      value: '',
      placeholder: $t('global.financeLedger.selectStore'),
      options: storeDict,
    });
    await getStoreList();
    return;
  }
  getLedgerList();
});
</script>

<template>
  <div v-loading="isLoading" class="order-page pd5">
    <el-card class="filter-card">
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
    </el-card>
    <el-card class="table-box mgt5">
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.filter-card {
  flex-shrink: 0;
}

.table-box {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
  }
}
</style>
