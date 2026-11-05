<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';
import { useUserStore } from '@vben/stores';

import { getContractListApi, getStoreListApi } from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

import ContractPrintHost from './ContractPrintHost.vue';
import { useContractPrint } from './useContractPrint';

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
const list = reactive<any[]>([]);
const { printVisible, printLoading, printData, openPrint, doPrint } = useContractPrint();

const tableConfig = reactive({
  list: [
    {
      prop: 'contractNo',
      label: $t('global.contract.contractNo'),
      width: '240px',
      showOverflowTooltip: true,
    },
    {
      prop: 'contractName',
      label: $t('global.contract.contractName'),
      width: '240px',
      showOverflowTooltip: true,
    },
    {
      prop: 'storeName',
      label: $t('global.contract.storeName'),
      width: '140px',
      showOverflowTooltip: true,
    },
    {
      prop: 'partyTypeLabel',
      label: $t('global.contract.partyType'),
      width: '90px',
    },
    {
      prop: 'statusLabel',
      label: $t('global.contract.contractStatus'),
      width: '110px',
    },
    {
      prop: 'platformSignStatusLabel',
      label: $t('global.contract.platformSign'),
      width: '100px',
    },
    {
      prop: 'merchantSignStatusLabel',
      label: $t('global.contract.merchantSign'),
      width: '100px',
    },
    {
      prop: 'totalAmount',
      label: $t('global.contract.totalAmount'),
      width: '130px',
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '180px',
      filter: (value: any) => (value ? String(value).slice(0, 19) : ''),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '130px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.printPreview'),
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
      prop: 'contractName',
      label: $t('global.contract.contractName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.contractName')}`,
    },
    {
      type: 'input',
      prop: 'contractNo',
      label: $t('global.contract.contractNo'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.contractNo')}`,
    },
    {
      type: 'select',
      prop: 'contractStatus',
      label: $t('global.contract.contractStatus'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.contractStatus')}`,
      options: [
        { label: $t('global.contract.statusDraft'), value: '0', keepValue: true },
        { label: $t('global.contract.statusPending'), value: '1', keepValue: true },
        { label: $t('global.contract.statusDone'), value: '2', keepValue: true },
        { label: $t('global.contract.statusVoid'), value: '3', keepValue: true },
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
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getList();
};

const handleClick = (row: any, label: string) => {
  if (label === $t('global.btn.printPreview')) {
    openPrint(row);
  }
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  getList();
};

const getList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getContractListApi(obj);
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data.list || []));
      total.value = res.data.total || 0;
    } else {
      ElMessage.error($t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const getStoreList = async () => {
  const res = await getStoreListApi({ pageSize: 9999, pageNum: 1 });
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
};

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.push({
      type: 'select',
      prop: 'storeId',
      label: $t('global.contract.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.storeName')}`,
      options: storeDict,
    });
    await getStoreList();
  }
  getList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
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

    <ContractPrintHost
      v-model:visible="printVisible"
      :loading="printLoading"
      :data="printData"
      @print="doPrint"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;
</style>
