<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import { getStoreListApi, getVisitorListApi } from '#/api';
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
      prop: 'visitorName',
      label: $t('global.visitor.visitorName'),
    },
    {
      prop: 'phone',
      label: $t('global.visitor.phone'),
    },
    {
      prop: 'remark',
      label: $t('global.visitor.remark'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'storeName',
      label: $t('global.visitor.storeName'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '180px',
      filter: (value: any) => (value ? String(value).slice(0, 19) : ''),
    },
  ],
});
const list = reactive([]);

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'visitorName',
      label: $t('global.visitor.visitorName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.visitor.visitorName')}`,
    },
    {
      type: 'input',
      prop: 'phone',
      label: $t('global.visitor.phone'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.visitor.phone')}`,
    },
    {
      type: 'date',
      prop: 'createdTime',
      label: $t('global.createdTime'),
      value: '',
      valueFormat: 'YYYY-MM-DD',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.createdTime')}`,
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
    obj.createdTimeStart = `${day} 00:00:00`;
    obj.createdTimeEnd = `${day} 23:59:59`;
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
  getVisitorList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getVisitorList();
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getVisitorList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  getVisitorList();
};

const getVisitorList = async () => {
  try {
    isLoading.value = true;
    const res = await getVisitorListApi(buildQuery());
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data.list || []));
      total.value = res.data.total;
    } else {
      ElMessage({
        type: 'error',
        message: $t('global.message.searchError'),
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
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.splice(2, 0, {
      type: 'select',
      prop: 'storeId',
      label: $t('global.visitor.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.visitor.storeName')}`,
      options: storeDict,
    });
    await getStoreList();
  }
  getVisitorList();
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
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;
</style>
