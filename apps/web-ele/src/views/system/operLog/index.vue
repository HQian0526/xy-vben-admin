<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

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
  ],
});

const search = (form: any) => {
  console.log('form', form);
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getOperLogList();
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
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

// 获取操作日志列表
const getOperLogList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
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
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss";
</style>
