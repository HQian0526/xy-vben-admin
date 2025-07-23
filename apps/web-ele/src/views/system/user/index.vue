<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { addUserApi, deleteUserApi, editUserApi, getUserListApi } from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const isLoading = ref(false);
//* *************table相关变量**************
const table = ref();
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'index',
    },
    {
      prop: 'userName',
      label: $t('global.user.userName'),
    },
    {
      prop: 'realName',
      label: $t('global.user.realName'),
    },
    {
      prop: 'sex',
      label: $t('global.user.sex'),
      filter: (value: any) => {
        return value === '0' || !value
          ? $t('global.user.woman')
          : $t('global.user.man');
      },
    },
    {
      prop: 'phone',
      label: $t('global.user.phone'),
    },
    {
      prop: 'email',
      label: $t('global.user.email'),
    },
    {
      prop: 'identityType',
      label: $t('global.user.identity'),
      filter: (value: any) => {
        if (value === 1) {
          return $t('global.user.normalUser');
        } else if (value === 2) {
          return $t('global.user.vipUser');
        } else {
          return $t('global.user.adminUser');
        }
      },
    },
    {
      prop: 'createdTime',
      label: $t('global.user.createTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'deleted',
      label: $t('global.user.status'),
      filter: (value: any) => {
        return value ? $t('global.user.lock') : $t('global.user.normal');
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '180px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.detail'),
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
      prop: 'realName',
      label: $t('global.user.realName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.user.realName')}`,
    },
    {
      type: 'input',
      prop: 'phone',
      label: $t('global.user.phone'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.user.phone')}`,
    },
    {
      type: 'select',
      prop: 'deleted',
      label: $t('global.user.status'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.user.status')}`,
      options: [
        {
          label: $t('global.user.normal'),
          value: '0',
        },
        {
          label: $t('global.user.lock'),
          value: '1',
        },
      ],
    },
  ],
});

//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单校验规则
const editRules = reactive({
  userName: [
    {
      required: true,
      message: $t('global.user.userName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  realName: [
    {
      required: true,
      message: $t('global.user.realName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  sex: [
    {
      required: true,
      message: $t('global.user.sex') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  phone: [
    {
      required: true,
      message: $t('global.user.phone') + $t('global.required'),
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: $t('global.user.phone') + $t('global.errorFormat'),
      trigger: 'blur',
    },
  ],
});
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.user.userName'),
    name: 'userName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.user.realName'),
    name: 'realName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.user.sex'),
    name: 'sex',
    type: 'select',
    readonly: false,
    options: [
      {
        label: '女',
        value: 0,
      },
      {
        label: '男',
        value: 1,
      },
    ],
  },
  {
    label: $t('global.user.phone'),
    name: 'phone',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.user.email'),
    name: 'email',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.user.birthday'),
    name: 'birthday',
    type: 'date',
    readonly: false,
  },
  {
    label: $t('global.user.identity'),
    name: 'identityType',
    type: 'select',
    readonly: false,
    options: [
      {
        label: '基础用户',
        value: 1,
      },
      {
        label: 'vip会员',
        value: 2,
      },
      {
        label: '管理员',
        value: 3,
      },
    ],
  },
  {
    label: $t('global.user.remark'),
    name: 'remark',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.user.address'),
    name: 'address',
    type: 'textarea',
    readonly: false,
    span: 24,
  },
]);

// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const search = (form: any) => {
  console.log('form', form);
  getUserList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getUserList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    case $t('global.btn.detail'): {
      formTitle.value = label;
      formInfo.value = { ...row }; // 确保是新的对象引用
      itemVisible.value = true;

      break;
    }
    case $t('global.btn.lock'): {
      handleDelete(row);

      break;
    }
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
  getUserList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getUserList();
};

// 关闭弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

// 确定
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  try {
    const res =
      title === $t('global.btn.add')
        ? await addUserApi(data)
        : await editUserApi(data);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getUserList();
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

// 删除
const handleDelete = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm($t('global.message.confirmLock'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await deleteUserApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getUserList();
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

// 解锁
const handleAlive = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm($t('global.message.confirmUnlock'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await editUserApi({ id: row.id, deleted: 0 });
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getUserList();
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

// 获取用户列表
const getUserList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getUserListApi(obj);
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

onMounted(() => {
  getUserList();
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
        ref="table"
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handle-click="handleClick"
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>
    <!-- 弹窗 -->
    <Edit
      ref="editForm"
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
.table-box {
  height: calc(100vh - 180px);
  overflow-y: auto;
}

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
