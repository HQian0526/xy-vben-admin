<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import { getStoreListApi } from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

import {
  formatBusinessHoursText,
  getOpenStatus,
} from './hours';
import SettingPanel from './SettingPanel.vue';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const isLoading = ref(false);
const merchantStore = ref<Record<string, any> | null>(null);
const drawerVisible = ref(false);
const editingStore = ref<Record<string, any>>({});

const total = ref(0);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({});
const list = reactive<any[]>([]);

const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.store.storeName'),
    },
    {
      prop: 'openLabel',
      label: $t('global.businessTime.currentStatus'),
    },
    {
      prop: 'hoursText',
      label: $t('global.businessTime.hoursText'),
    },
    {
      prop: 'deliveryFee',
      label: $t('global.businessTime.deliveryFee'),
      filter: (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n.toFixed(2) : '0.00';
      },
    },
    {
      prop: 'manualLabel',
      label: $t('global.businessTime.manualStatus'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '120px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.setting'),
          isShow: () => true,
        },
      ],
    },
  ],
});

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'storeName',
      label: $t('global.store.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.store.storeName')}`,
    },
  ],
});

function mapStoreRow(item: any) {
  const status = getOpenStatus(item);
  const openLabel =
    status === 'closed'
      ? $t('global.businessTime.closed')
      : status === 'rest'
        ? $t('global.businessTime.rest')
        : $t('global.businessTime.open');
  return {
    ...item,
    openLabel,
    hoursText:
      item.businessHoursText ||
      formatBusinessHoursText(item.businessHours) ||
      $t('global.businessTime.allDayUnset'),
    manualLabel:
      item.manuallyClosed === true || getOpenStatus(item) === 'closed'
        ? $t('global.businessTime.closed')
        : $t('global.businessTime.open'),
  };
}

const getMerchantStore = async () => {
  const userId = userStore.userInfo?.id;
  if (!userId) {
    ElMessage.error($t('global.businessTime.noStore'));
    return;
  }
  try {
    isLoading.value = true;
    const res = await getStoreListApi({
      userId,
      deleted: 0,
      pageNum: 1,
      pageSize: 1,
    });
    if (res.code === 200) {
      const row = (res.data?.list || [])[0];
      merchantStore.value = row ? mapStoreRow(row) : null;
      if (!merchantStore.value) {
        ElMessage.warning($t('global.businessTime.noStore'));
      }
    } else {
      ElMessage.error($t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const getAdminStoreList = async () => {
  try {
    isLoading.value = true;
    const res = await getStoreListApi({
      ...searchParams.value,
      deleted: 0,
      pageNum: pageInfo.pageNum,
      pageSize: pageInfo.pageSize,
    });
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data?.list || []).map((item: any) => mapStoreRow(item)));
      total.value = res.data?.total || 0;
    } else {
      ElMessage.error($t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const search = (form: any) => {
  pageInfo.pageNum = 1;
  searchParams.value = { ...form };
  getAdminStoreList();
};

const reset = () => {
  pageInfo.pageNum = 1;
  searchParams.value = {};
  getAdminStoreList();
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getAdminStoreList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  pageInfo.pageNum = 1;
  getAdminStoreList();
};

const handleClick = (row: any, label: string) => {
  if (label === $t('global.btn.setting')) {
    editingStore.value = { ...row };
    drawerVisible.value = true;
  }
};

const handlePanelUpdated = async () => {
  if (isAdmin.value) {
    await getAdminStoreList();
    if (editingStore.value?.id) {
      const next = list.find(
        (item) => String(item.id) === String(editingStore.value.id),
      );
      if (next) {
        editingStore.value = { ...next };
      }
    }
  } else {
    await getMerchantStore();
  }
};

onMounted(() => {
  if (isAdmin.value) {
    getAdminStoreList();
  } else {
    getMerchantStore();
  }
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <template v-if="isAdmin">
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
      <el-drawer
        v-model="drawerVisible"
        :title="editingStore.storeName || $t('global.businessTime.title')"
        size="560px"
        destroy-on-close
      >
        <SettingPanel
          v-if="editingStore.id"
          :store="editingStore"
          @updated="handlePanelUpdated"
        />
      </el-drawer>
    </template>

    <el-card v-else>
      <el-empty
        v-if="!merchantStore"
        :description="$t('global.businessTime.noStore')"
      />
      <SettingPanel
        v-else
        :store="merchantStore"
        @updated="handlePanelUpdated"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.filter-card {
  flex-shrink: 0;
}
</style>
