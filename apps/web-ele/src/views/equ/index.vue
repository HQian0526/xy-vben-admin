<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addStoreApi,
  deleteStoreApi,
  editStoreApi,
  getStoreListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
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
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'storeId',
      label: $t('global.store.storeCode'),
    },
    {
      prop: 'storeName',
      label: $t('global.store.storeName'),
    },
    {
      prop: 'address',
      label: $t('global.store.storeAddress'),
    },
    {
      prop: 'realName',
      label: $t('global.store.storeManager'),
    },
    {
      prop: 'identityPhone',
      label: $t('global.store.storePhone'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'storeTime',
      label: $t('global.store.expirationTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'storeType',
      label: $t('global.store.storeType'),
      filter: (value: any) => {
        return value === 1
          ? $t('global.store.forever')
          : $t('global.store.rent');
      },
    },
    {
      prop: 'deleted',
      label: $t('global.store.storeStatus'),
      filter: (value: any) => {
        return value ? $t('global.store.lock') : $t('global.store.normal');
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '200px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
        },
        {
          type: 'success',
          label: $t('global.btn.unlock'),
          isShow: (item: any) => Number(item.deleted) === 1,
        },
        {
          type: 'danger',
          label: $t('global.btn.lock'),
          isShow: (item: any) => !item.deleted,
        },
      ],
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
const isCollapsed = ref(false);
// 头部搜索框
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'storeName',
      label: $t('global.store.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.store.storeName')}`,
    },
    {
      type: 'select',
      prop: 'storeType',
      label: $t('global.store.storeType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.store.storeType')}`,
      options: [
        {
          label: $t('global.store.forever'),
          value: '1',
        },
        {
          label: $t('global.store.rent'),
          value: '2',
        },
      ],
    },
    {
      type: 'select',
      prop: 'deleted',
      label: $t('global.store.storeStatus'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.store.storeStatus')}`,
      options: [
        {
          label: $t('global.store.normal'),
          value: '0',
        },
        {
          label: $t('global.store.lock'),
          value: '1',
        },
      ],
    },
  ],
});
// 选人相关
const selectedUsers = reactive({}); // 选人组件回调
const selectedPeople = ref({
  realName: [],
}); // 传给选人组件
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.store.storeCode'),
    name: 'storeId',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.store.storeName'),
    name: 'storeName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.store.storeManager'),
    name: 'realName',
    type: 'selectPeople',
    readonly: false,
    append: {
      label: $t('global.select'),
    },
    options: selectedPeople.value.realName,
  },
  {
    label: $t('global.store.storePhone'),
    name: 'identityPhone',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.store.businessName'),
    name: 'identityCompanyName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.store.storeEmail'),
    name: 'identityEmail',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.store.businessOwner'),
    name: 'identityName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.store.idCardNo'),
    name: 'identityNo',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.createdTime'),
    name: 'createdTime',
    type: 'date',
    readonly: false,
  },
  {
    label: $t('global.store.storeStatus'),
    name: 'deleted',
    type: 'select',
    readonly: false,
    options: [
      {
        label: $t('global.store.normal'),
        value: 0,
      },
      {
        label: $t('global.store.lock'),
        value: 1,
      },
    ],
  },
  {
    label: $t('global.store.storeType'),
    name: 'storeType',
    type: 'select',
    readonly: false,
    options: [
      {
        label: $t('global.store.forever'),
        value: 1,
      },
      {
        label: $t('global.store.rent'),
        value: 2,
      },
    ],
  },
  {
    label: $t('global.store.expirationTime'),
    name: 'storeTime',
    type: 'date',
    readonly: false,
  },
  {
    label: $t('global.store.storeAddress'),
    name: 'address',
    type: 'textarea',
    readonly: false,
    span: 24,
  },
  {
    label: $t('global.store.remark'),
    name: 'remark',
    type: 'textarea',
    readonly: false,
    span: 24,
  },
  {
    label: $t('global.store.businessLicense'),
    name: 'businessLicense',
    type: 'uploadImg',
    readonly: false,
    span: 8,
    limit: 1,
  },
  {
    label: $t('global.store.idCard'),
    name: 'identityPhoto',
    type: 'uploadImg',
    readonly: false,
    span: 16,
    limit: 2,
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  storeId: [
    {
      required: true,
      message: $t('global.store.storeCode') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  storeName: [
    {
      required: true,
      message: $t('global.store.storeName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  realName: [
    {
      required: true,
      message: $t('global.store.storeManager') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  identityNo: [
    {
      required: true,
      message: $t('global.store.idCardNo') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  address: [
    {
      required: true,
      message: $t('global.store.storeAddress') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});

// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const search = (form: any) => {
  console.log('form', form);
  getStoreList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getStoreList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    // 编辑
    case $t('global.btn.edit'): {
      // 编辑
      formTitle.value = label;
      // 处理选人逻辑
      selectedPeople.value.realName = [];
      selectedPeople.value.realName.push({
        userId: row.userId,
        userName: row.userName,
        realName: row.realName,
      });
      selectedUsers.realName = selectedPeople.value.realName;
      formInfo.value = {
        ...row,
        selectedUsers: { realName: selectedPeople.value.realName },
      }; // 确保是新的对象引用
      itemVisible.value = true;
      break;
    }
    // 冻结
    case $t('global.btn.lock'): {
      handleDelete(row);
      break;
    }
    // 解冻
    case $t('global.btn.unlock'): {
      handleAlive(row);
      break;
    }
    // No default
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getStoreList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getStoreList();
};

// 关闭编辑弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

// 确定编辑弹窗
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  const obj = {
    // 营业执照
    businessLicense: data.businessLicense
      .map((item: any) => item.url)
      .join(','),
    // 负责人
    userId: selectedUsers.realName.map((item: any) => item.userId).join(','),
    // 身份证正面
    identityPhoto: data.identityPhoto.map((item: any) => item.url).join(','),
    userName: null,
    realName: Array.isArray(data.realName)
      ? data.realName.join(',')
      : data.realName,
  };
  try {
    const res =
      title === $t('global.btn.add')
        ? await addStoreApi({ ...data, ...obj })
        : await editStoreApi({ ...data, ...obj });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getStoreList();
      itemVisible.value = false;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg,
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

// 解锁
const handleAlive = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm($t('global.message.confirmUnlock'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await editStoreApi({ id: row.id, deleted: 0 });
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getStoreList();
      } else {
        ElMessage({
          type: 'error',
          message: $t('global.message.error'),
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// 删除
const handleDelete = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await deleteStoreApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getStoreList();
      } else {
        ElMessage({
          type: 'error',
          message: $t('global.message.error'),
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// 获取商户列表
const getStoreList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getStoreListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...res.data.list); // 添加新数据
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

// 获取弹窗已选用户列表
const selectedUser = (key: string, value: any) => {
  console.log('key', key);
  console.log('value', value);
  selectedUsers[key] = value;
};

onMounted(() => {
  getStoreList(); // 获取商户列表
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset">
        <template #extra>
          <el-button link type="primary" @click="toggleCollapse">
            {{
              isCollapsed
                ? $t('global.btn.expandMore')
                : $t('global.btn.collapseMore')
            }}
          </el-button>

          <div v-show="!isCollapsed" class="button-group">
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
    <!-- 编辑弹窗 -->
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
      @selected-user="selectedUser"
    />
  </div>
</template>

<style lang="scss" scoped>
.table-box {
  height: calc(100vh - 180px);
  overflow-y: auto;
}

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
