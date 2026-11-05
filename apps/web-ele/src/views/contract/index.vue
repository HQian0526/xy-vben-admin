<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Download, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@vben/stores';

import {
  deleteContractApi,
  downloadContractFileApi,
  exportContractApi,
  getContractDetailApi,
  getContractListApi,
  getStoreListApi,
  initiateSignApi,
  platformSignApi,
  voidContractApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { resolveFileUrl } from '#/utils';

import ContractPrintHost from './ContractPrintHost.vue';
import { useContractPrint } from './useContractPrint';

const router = useRouter();
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

function saveBlob(data: any, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  if (blob.type && blob.type.includes('application/json')) {
    return blob.text().then((text) => {
      try {
        const json = JSON.parse(text);
        ElMessage.error(json.msg || $t('global.message.error'));
      } catch {
        ElMessage.error($t('global.message.error'));
      }
    });
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

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
      width: '440px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: (item: any) => Number(item.contractStatus) === 0,
        },
        {
          type: 'success',
          label: $t('global.btn.initiateSign'),
          isShow: (item: any) => Number(item.contractStatus) === 0,
        },
        {
          type: 'warning',
          label: $t('global.btn.platformSign'),
          isShow: (item: any) =>
            Number(item.contractStatus) === 1 && Number(item.platformSignStatus) === 0,
        },
        {
          type: 'primary',
          label: $t('global.btn.detail'),
          isShow: () => true,
        },
        {
          type: 'default',
          label: $t('global.btn.print'),
          isShow: () => true,
        },
        {
          type: 'info',
          label: $t('global.btn.signProgress'),
          isShow: (item: any) => Number(item.contractStatus) !== 0,
        },
        // {
        //   type: 'success',
        //   label: $t('global.btn.download'),
        //   isShow: (item: any) => Number(item.contractStatus) === 2,
        // },
        {
          type: 'danger',
          label: $t('global.btn.voidContract'),
          isShow: (item: any) => Number(item.contractStatus) === 1,
        },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          isShow: (item: any) => Number(item.contractStatus) === 0,
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
  switch (label) {
    case $t('global.btn.edit'): {
      router.push({ path: '/contract-detail', query: { no: row.contractNo } });
      break;
    }
    case $t('global.btn.detail'): {
      router.push({ path: '/contract-detail', query: { no: row.contractNo } });
      break;
    }
    case $t('global.btn.signProgress'): {
      openSignProgress(row);
      break;
    }
    case $t('global.btn.print'): {
      openPrint(row);
      break;
    }
    case $t('global.btn.initiateSign'): {
      handleInitiate(row);
      break;
    }
    case $t('global.btn.platformSign'): {
      handlePlatformSign(row);
      break;
    }
    case $t('global.btn.download'): {
      handleDownload(row);
      break;
    }
    case $t('global.btn.voidContract'): {
      handleVoid(row);
      break;
    }
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
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

const handleAdd = () => {
  router.push({ path: '/contract-detail' });
};

const progressVisible = ref(false);
const progressLoading = ref(false);
const progressTitle = ref('');
const progressSigners = ref<any[]>([]);

const openSignProgress = async (row: any) => {
  progressTitle.value = row.contractName
    ? `${row.contractName}（${row.contractNo}）`
    : row.contractNo;
  progressSigners.value = [];
  progressVisible.value = true;
  progressLoading.value = true;
  try {
    const res = await getContractDetailApi(row.contractNo);
    if (res.code === 200) {
      progressSigners.value = res.data?.signers || [];
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
      progressVisible.value = false;
    }
  } catch (error: any) {
    if (error?.msg) ElMessage.error(error.msg);
    progressVisible.value = false;
  } finally {
    progressLoading.value = false;
  }
};

const { printVisible, printLoading, printData, openPrint, doPrint } = useContractPrint();

const handleInitiate = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认发起签署？平台将尝试自动盖章。', $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    });
    const res = await initiateSignApi(row.contractNo);
    if (res.code === 200) {
      ElMessage.success(res.data?.message || $t('global.message.success'));
      getList();
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    if (error !== 'cancel' && error?.msg) {
      ElMessage.error(error.msg);
    }
  }
};

const handlePlatformSign = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认完成平台签署？完成后将推送给商家。', $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    });
    const res = await platformSignApi(row.contractNo);
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      getList();
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    if (error !== 'cancel' && error?.msg) {
      ElMessage.error(error.msg);
    }
  }
};

const handleVoid = (row: any) => {
  ElMessageBox.prompt('请输入作废原因（选填）', $t('global.btn.voidContract'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
  })
    .then(async ({ value }) => {
      const res = await voidContractApi(row.contractNo, value);
      if (res.code === 200) {
        ElMessage.success($t('global.message.success'));
        getList();
      } else {
        ElMessage.error(res.msg || $t('global.message.error'));
      }
    })
    .catch(() => {});
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
    type: 'warning',
  })
    .then(async () => {
      const res = await deleteContractApi([row.id]);
      if (res.code === 200) {
        ElMessage.success($t('global.message.success'));
        getList();
      } else {
        ElMessage.error(res.msg || $t('global.message.error'));
      }
    })
    .catch(() => {});
};

const handleDownload = async (row: any) => {
  try {
    const blob = await downloadContractFileApi(row.contractNo);
    await saveBlob(blob, `${row.contractNo}.txt`);
  } catch (error) {
    console.log(error);
  }
};

const handleExport = async () => {
  try {
    const blob = await exportContractApi({ ...searchParams.value });
    await saveBlob(blob, 'esign-contracts.csv');
  } catch (error) {
    console.log(error);
  }
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
      <Filter :form-config="formConfig" @search="search" @reset="reset">
        <template #extra>
          <div class="button-group">
            <el-button v-if="isAdmin" type="success" :icon="Plus" @click="handleAdd">
              {{ $t('global.btn.add') }}
            </el-button>
            <el-button type="primary" :icon="Download" @click="handleExport">
              {{ $t('global.btn.export') }}
            </el-button>
          </div>
        </template>
      </Filter>
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

    <el-dialog
      v-model="progressVisible"
      :title="$t('global.contract.signProgress')"
      width="560px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div v-loading="progressLoading" class="progress-dialog">
        <p v-if="progressTitle" class="progress-name">{{ progressTitle }}</p>
        <el-timeline v-if="progressSigners.length">
          <el-timeline-item
            v-for="item in progressSigners"
            :key="item.id"
            :timestamp="item.signTime ? String(item.signTime).slice(0, 19) : item.signStatusLabel"
            :type="Number(item.signStatus) === 1 ? 'success' : 'primary'"
          >
            {{ item.partyRoleLabel }} · {{ item.signerName }}
            <span v-if="item.companyName">（{{ item.companyName }}）</span>
            · {{ item.signStatusLabel }}
            <el-image
              v-if="item.signImageUrl"
              class="progress-sign-img"
              :src="resolveFileUrl(item.signImageUrl)"
              fit="contain"
              :preview-src-list="[resolveFileUrl(item.signImageUrl)]"
            />
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else-if="!progressLoading" :description="$t('global.contract.noSigners')" />
      </div>
    </el-dialog>

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

.button-group {
  display: inline-flex;
  margin-left: 10px;
}

.progress-dialog {
  min-height: 120px;
}

.progress-name {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  word-break: break-all;
}

.progress-sign-img {
  display: block;
  width: 180px;
  height: 72px;
  margin-top: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
}
</style>
