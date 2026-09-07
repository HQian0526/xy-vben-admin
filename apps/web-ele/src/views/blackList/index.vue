<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addStoreBlacklistApi,
  deleteStoreBlacklistApi,
  getStoreBlacklistApi,
  getStoreListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const isLoading = ref(false);
//* *************table相关变量**************
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({}); // 缓存查询条件，供分页复用
const storeDict = reactive<Array<{ label: string; value: any }>>([]); // 店铺下拉
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'phone',
      label: $t('global.blackList.phone'),
      filter: (value: any) => {
        return value || '—';
      },
    },
    {
      prop: 'realName',
      label: $t('global.blackList.realName'),
    },
    {
      prop: 'storeName',
      label: $t('global.blackList.storeName'),
    },
    {
      prop: 'remark',
      label: $t('global.blackList.remark'),
    },
    {
      prop: 'createdBy',
      label: $t('global.createdBy'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? String(value).slice(0, 19) : '';
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '140px',
      operations: [
        {
          type: 'danger',
          label: $t('global.btn.removeBlacklist'),
          isShow: () => true,
        },
      ],
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
// 头部搜索框（所属店铺仅管理员动态插入）
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'phone',
      label: $t('global.blackList.phone'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.blackList.phone')}`,
    },
  ] as Array<Record<string, any>>,
});
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单配置（管理员新增时动态插入所属店铺）
const editConfig = reactive([
  {
    label: $t('global.blackList.phone'),
    name: 'phone',
    type: 'input',
    span: 24,
  },
  {
    label: $t('global.blackList.remark'),
    name: 'remark',
    type: 'textarea',
    span: 24,
  },
] as Array<Record<string, any>>);
// 弹窗表单校验规则
const editRules = reactive({
  phone: [
    {
      required: true,
      message: $t('global.blackList.phone') + $t('global.required'),
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: $t('global.blackList.phone') + $t('global.errorFormat'),
      trigger: 'blur',
    },
  ],
  storeId: [
    {
      required: true,
      message: $t('global.blackList.storeName') + $t('global.required'),
      trigger: 'change',
    },
  ],
});

const search = (form: any) => {
  console.log('form', form);
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getBlackList();
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getBlackList();
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    case $t('global.btn.removeBlacklist'): {
      handleRemoveBlacklist(row);
      break;
    }
    // No default
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getBlackList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getBlackList();
};

// 关闭编辑弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

// 确定新增弹窗
const confirmDialog = async (_title: string, data: any) => {
  console.log('data', data);
  try {
    const payload = { ...data };
    delete payload.id;
    // 商户不传 storeId，由后端取本店；超管必传且保持字符串，避免雪花ID精度丢失
    if (!isAdmin.value) {
      delete payload.storeId;
    } else if (payload.storeId != null && payload.storeId !== '') {
      payload.storeId = String(payload.storeId);
    }
    const res = await addStoreBlacklistApi(payload);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getBlackList();
      itemVisible.value = false;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || $t('global.message.error'),
      });
    }
  } catch {}
};

// 新增
const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  formInfo.value = {}; // 清空表单数据
  itemVisible.value = true;
};

// 解除拉黑
const handleRemoveBlacklist = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm(
      $t('global.message.confirmRemoveBlacklist'),
      $t('global.tip'),
      {
        confirmButtonText: $t('global.btn.confirm'),
        cancelButtonText: $t('global.btn.cancel'),
        type: 'warning',
      },
    ).then(async () => {
      const res = await deleteStoreBlacklistApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getBlackList();
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

// 获取黑名单列表
const getBlackList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  // 非管理员不传 storeId，由后端按身份限制本店
  if (!isAdmin.value) {
    delete obj.storeId;
  }
  try {
    isLoading.value = true;
    const res = await getStoreBlacklistApi(obj);
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

// 获取店铺列表（仅管理员）
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
          // 店铺id为雪花长整型，避免被转 Number 丢精度
          keepValue: true,
        })),
      );
    } else {
      ElMessage({
        type: 'error',
        message: $t('global.message.error'),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  // 仅管理员展示「所属店铺」筛选与新增字段
  if (isAdmin.value) {
    formConfig.list.push({
      type: 'select',
      prop: 'storeId',
      label: $t('global.blackList.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.blackList.storeName')}`,
      options: storeDict,
    });
    editConfig.unshift({
      label: $t('global.blackList.storeName'),
      name: 'storeId',
      type: 'select',
      span: 24,
      options: storeDict,
    });
    await getStoreList();
  }
  getBlackList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset">
        <template #extra>
          <div class="button-group">
            <el-button type="success" :icon="Plus" @click="handleAdd">
              {{ $t('global.btn.add') }}
            </el-button>
          </div>
        </template>
      </Filter>
    </el-card>
    <el-card class="table-box mgt5">
      <!-- 表格 -->
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handle-click="handleClick"
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>
    <!-- 新增弹窗 -->
    <Edit
      ref="editForm"
      label-width="100px"
      :form-config="editConfig"
      :form-rules="editRules"
      :title="formTitle"
      :form-info="formInfo"
      :visible="itemVisible"
      @close="closeDialog"
      @confirm="confirmDialog"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
