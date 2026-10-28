<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import { getStoreListApi, getStoreVerifyLogApi } from '#/api';
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
const operatorTypeDict = [
  { label: $t('global.verifyLog.merchant'), value: 1 },
  { label: $t('global.verifyLog.staff'), value: 2 },
  { label: $t('global.verifyLog.admin'), value: 3 },
];

const tableConfig = reactive({
  list: [
    {
      prop: 'createdTime',
      label: $t('global.verifyLog.time'),
      width: '180px',
      filter: (value: any) => (value ? String(value).slice(0, 19) : ''),
    },
    {
      prop: 'customerName',
      label: $t('global.verifyLog.customerName'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'customerPhone',
      label: $t('global.verifyLog.customerPhone'),
    },
    {
      prop: 'amount',
      label: $t('global.verifyLog.amount'),
      width: '120px',
      filter: (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n.toFixed(2) : '0.00';
      },
    },
    {
      prop: 'operatorName',
      label: $t('global.verifyLog.operatorName'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'operatorTypeName',
      label: $t('global.verifyLog.operatorType'),
      width: '100px',
      filter: (value: any) => value || '—',
    },
    {
      prop: 'remark',
      label: $t('global.verifyLog.remark'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'storeName',
      label: $t('global.verifyLog.storeName'),
      filter: (value: any) => value || '—',
    },
  ],
});
const list = reactive([]);

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'customerPhone',
      label: $t('global.verifyLog.customerPhone'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.verifyLog.customerPhone')}`,
    },
    {
      type: 'input',
      prop: 'operatorName',
      label: $t('global.verifyLog.operatorName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.verifyLog.operatorName')}`,
    },
    {
      type: 'select',
      prop: 'operatorType',
      label: $t('global.verifyLog.operatorType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.verifyLog.operatorType')}`,
      options: operatorTypeDict,
    },
    {
      type: 'date',
      prop: 'createdTime',
      label: $t('global.verifyLog.date'),
      value: '',
      valueFormat: 'YYYY-MM-DD',
      placeholder: $t('global.verifyLog.selectDate'),
    },
  ] as Array<Record<string, any>>,
});

function buildQuery() {
  const obj: Record<string, any> = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  const day = obj.createdTime;
  if (day) {
    obj.createdTimeStart = `${String(day).slice(0, 10)} 00:00:00`;
    obj.createdTimeEnd = `${String(day).slice(0, 10)} 23:59:59`;
    delete obj.createdTime;
  }
  if (!isAdmin.value) {
    delete obj.storeId;
  } else if (obj.storeId != null && obj.storeId !== '') {
    obj.storeId = String(obj.storeId);
  }
  return obj;
}

const search = (form: any) => {
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getVerifyLogList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getVerifyLogList();
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getVerifyLogList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  getVerifyLogList();
};

const getVerifyLogList = async () => {
  try {
    isLoading.value = true;
    const res = await getStoreVerifyLogApi(buildQuery());
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
          keepValue: true,
        })),
      );
    }
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.unshift({
      type: 'select',
      prop: 'storeId',
      label: $t('global.verifyLog.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.verifyLog.storeName')}`,
      options: storeDict,
    });
    await getStoreList();
  }
  getVerifyLogList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
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
