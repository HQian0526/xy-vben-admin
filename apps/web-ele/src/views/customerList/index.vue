<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage, ElMessageBox } from 'element-plus';

import { addStoreBlacklistApi, getCustomerListApi } from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const isLoading = ref(false);
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({});
const tableConfig = reactive({
  list: [
    {
      prop: 'realName',
      label: $t('global.customerList.realName'),
    },
    {
      prop: 'phone',
      label: $t('global.customerList.phone'),
    },
    {
      prop: 'sex',
      label: $t('global.user.sex'),
      filter: (value: any) => {
        return value === '0' || value === 0 || !value
          ? $t('global.user.woman')
          : $t('global.user.man');
      },
    },
    {
      prop: 'storeName',
      label: $t('global.customerList.storeName'),
    },
    {
      prop: 'email',
      label: $t('global.user.email'),
    },
    {
      prop: 'createdTime',
      label: $t('global.user.createTime'),
      filter: (value: any) => {
        return value ? String(value).slice(0, 10) : '';
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '120px',
      operations: [
        {
          type: 'danger',
          label: $t('global.btn.blacklist'),
          isShow: () => true,
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
      prop: 'phone',
      label: $t('global.customerList.phone'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.customerList.phone')}`,
    },
  ],
});

const search = (form: any) => {
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getCustomerList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getCustomerList();
};

const handleClick = (row: any, label: string) => {
  switch (label) {
    case $t('global.btn.blacklist'): {
      handleBlacklist(row);
      break;
    }
    // No default
  }
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getCustomerList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  getCustomerList();
};

const handleBlacklist = (row: any) => {
  try {
    ElMessageBox.confirm(
      $t('global.message.confirmBlacklist'),
      $t('global.tip'),
      {
        confirmButtonText: $t('global.btn.confirm'),
        cancelButtonText: $t('global.btn.cancel'),
        type: 'warning',
      },
    ).then(async () => {
      const payload: Record<string, any> = {
        userId: row.id != null ? String(row.id) : undefined,
      };
      if (row.phone) {
        payload.phone = row.phone;
      }
      if (isAdmin.value && row.bindStoreId != null && row.bindStoreId !== '') {
        payload.storeId = String(row.bindStoreId);
      }
      const res = await addStoreBlacklistApi(payload);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getCustomerList();
      } else {
        ElMessage({
          type: 'error',
          message: res.msg || $t('global.message.error'),
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const getCustomerList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getCustomerListApi(obj);
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data.list || []));
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

onMounted(() => {
  getCustomerList();
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
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;
</style>
