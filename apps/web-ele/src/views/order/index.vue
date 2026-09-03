<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';

import { getMallOrderListApi } from '#/api';
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

const payStatusMap: Record<number, string> = {
  0: $t('global.order.pendingPay'),
  1: $t('global.order.paid'),
  2: $t('global.order.closed'),
  3: $t('global.order.refunding'),
  4: $t('global.order.partialRefund'),
  5: $t('global.order.fullRefund'),
};

// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'orderNo',
      label: $t('global.order.orderNo'),
      width: '190px',
    },
    {
      prop: 'storeName',
      label: $t('global.order.storeName'),
    },
    {
      prop: 'contact',
      label: $t('global.order.contact'),
      width: '120px',
    },
    {
      prop: 'payAmount',
      label: $t('global.order.payAmount'),
      width: '100px',
    },
    {
      prop: 'payStatus',
      label: $t('global.order.payStatus'),
      width: '110px',
      filter: (value: any) => {
        return payStatusMap[Number(value)] ?? value;
      },
    },
    {
      prop: 'paidTime',
      label: $t('global.order.paidTime'),
      width: '170px',
      filter: (value: any) => {
        return value || '--';
      },
    },
    {
      prop: 'refundAmount',
      label: $t('global.order.refundAmount'),
      width: '110px',
      filter: (value: any) => {
        return value == null || value === '' ? '0' : value;
      },
    },
    {
      prop: 'address',
      label: $t('global.order.address'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '170px',
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
// 头部搜索框：当前后端列表接口主要支持 payStatus 过滤
const formConfig = reactive({
  list: [
    {
      type: 'select',
      prop: 'payStatus',
      label: $t('global.order.payStatus'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.order.payStatus')}`,
      options: [
        { label: $t('global.order.pendingPay'), value: '0' },
        { label: $t('global.order.paid'), value: '1' },
        { label: $t('global.order.closed'), value: '2' },
        { label: $t('global.order.refunding'), value: '3' },
        { label: $t('global.order.partialRefund'), value: '4' },
        { label: $t('global.order.fullRefund'), value: '5' },
      ],
    },
  ],
});

const search = (form: any) => {
  console.log('form', form);
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getOrderList();
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getOrderList();
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getOrderList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getOrderList();
};

// 获取订单列表
const getOrderList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getMallOrderListApi(obj);
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

onMounted(() => {
  getOrderList();
});
</script>

<template>
  <div v-loading="isLoading" class="order-page pd5">
    <el-card class="filter-card">
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
    </el-card>
    <el-card class="table-box mgt5">
      <!-- 表格 -->
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
@import "#/styles/style.scss";

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
