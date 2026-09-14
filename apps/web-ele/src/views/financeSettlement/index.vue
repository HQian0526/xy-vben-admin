<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  getPendingSettlementStoresApi,
  settleStoreApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const isLoading = ref(false);
const settling = ref(false);
const total = ref(0);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({
  settleStatus: 'pending',
});

const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.settlement.storeName'),
    },
    {
      prop: 'pendingAmount',
      label: $t('global.settlement.pendingAmount'),
      width: '140px',
      filter: (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n.toFixed(2) : '0.00';
      },
    },
    {
      prop: 'orderCount',
      label: $t('global.settlement.orderCount'),
      width: '140px',
    },
    {
      prop: 'lastPaidTime',
      label: $t('global.settlement.lastPaidTime'),
      width: '180px',
      filter: (value: any) => {
        return value || '--';
      },
    },
    {
      prop: 'lastSettleTime',
      label: $t('global.settlement.lastSettleTime'),
      width: '180px',
      filter: (value: any) => {
        return value || '--';
      },
    },
    {
      prop: 'status',
      label: $t('global.settlement.status'),
      width: '120px',
      filter: (value: any) => {
        return value || $t('global.settlement.pending');
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '120px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.settle'),
          isShow: (item: any) =>
            isAdmin.value && Number(item?.pendingAmount) > 0,
        },
      ],
    },
  ],
});
const list = reactive([]);

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'storeName',
      label: $t('global.settlement.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.settlement.storeName')}`,
    },
    {
      type: 'select',
      prop: 'settleStatus',
      label: $t('global.settlement.status'),
      value: 'pending',
      clearable: false,
      placeholder: $t('global.settlement.selectStatus'),
      options: [
        { label: $t('global.settlement.pending'), value: 'pending' },
        { label: $t('global.settlement.settled'), value: 'settled' },
      ],
    },
  ] as Array<Record<string, any>>,
});

const search = (form: any) => {
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = item.prop === 'settleStatus' ? 'pending' : null;
  });
  searchParams.value = { settleStatus: 'pending' };
  pageInfo.pageNum = 1;
  getList();
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  pageInfo.pageNum = 1;
  getList();
};

const handleClick = (row: any, label: string) => {
  if (label === $t('global.btn.settle')) {
    handleSettle(row);
  }
};

const getList = async () => {
  if (!isAdmin.value) {
    list.length = 0;
    total.value = 0;
    return;
  }
  const params: Record<string, any> = {
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  const storeName = String(searchParams.value.storeName || '').trim();
  if (storeName) {
    params.storeName = storeName;
  }
  params.settleStatus =
    searchParams.value.settleStatus === 'settled' ? 'settled' : 'pending';
  try {
    isLoading.value = true;
    const res = await getPendingSettlementStoresApi(params);
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

const handleSettle = (row: any) => {
  if (!row?.storeId) return;
  ElMessageBox.confirm(
    $t('global.message.confirmSettle'),
    $t('global.tip'),
    {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    },
  )
    .then(async () => {
      if (settling.value) return;
      settling.value = true;
      try {
        const res = await settleStoreApi({
          storeId: String(row.storeId),
        });
        if (res.code === 200) {
          ElMessage.success($t('global.message.success'));
          await getList();
        } else {
          ElMessage.error(res.msg || $t('global.message.error'));
        }
      } catch (error) {
        console.log(error);
      } finally {
        settling.value = false;
      }
    })
    .catch(() => {});
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div v-loading="isLoading" class="order-page pd5">
    <el-alert
      v-if="!isAdmin"
      type="warning"
      :closable="false"
      show-icon
      class="mb-3"
      :title="$t('global.settlement.adminOnly')"
    />
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="mb-3"
      :title="$t('global.settlement.tip')"
    />
    <el-card class="filter-card">
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
    </el-card>
    <el-card class="table-box mgt5">
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handle-click="handleClick"
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

.mb-3 {
  margin-bottom: 12px;
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
