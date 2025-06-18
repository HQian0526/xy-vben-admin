<template>
  <div class="pd5">
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
            <el-button type="success" @click="handleAdd">{{
              $t('global.btn.add')
            }}</el-button>
          </div>
        </template>
      </Filter>
    </el-card>
    <el-card class="table-box mgt5">
      <!-- 表格 -->
      <Table :table-config="tableConfig" :list="list" :total="total" @handleClick="handleClick"
        @handleCurrentChange="handleCurrentChange" @handleSizeChange="handleSizeChange"></Table>
    </el-card>
    <!-- 弹窗 -->
    <Edit ref="editForm" :formConfig="editConfig" :formRules="editRules" :title="formTitle" :formInfo="othersInfo"
      :visible="itemVisible" @close="closeDialog" @confirm="confirmDialog"></Edit>
  </div>
</template>

<script lang="ts" setup>
import { getUserListApi } from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { ElButton, ElCard, ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
//**************table相关变量**************
let total = ref(10);
let pageInfo = reactive({
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
      dict: [
        {
          key: '0',
          value: '女',
        },
        {
          key: '1',
          value: '男',
        },
      ],
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
      prop: 'identity',
      label: $t('global.user.identity'),
      dict: [
        {
          key: '1',
          value: '基础用户',
        },
        {
          key: '2',
          value: 'vip会员',
        },
        {
          key: '3',
          value: '超级管理员',
        },
      ],
    },
    {
      prop: 'createTime',
      label: $t('global.user.createTime'),
    },
    {
      prop: 'status',
      label: $t('global.user.status'),
      dict: [
        {
          key: '0',
          value: '正常',
        },
        {
          key: '1',
          value: '冻结',
        },
      ],
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '250px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.detail'),
          show: true,
        },
        {
          type: 'success',
          label: $t('global.btn.unlock'),
          show: true,
        },
        {
          type: 'danger',
          label: $t('global.btn.lock'),
          show: true,
        },
      ],
    },
  ],
});

// 表格数据
let list = reactive([]);
//**************filter相关变量**************
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

//**************edit相关变量**************
let itemVisible = ref(false); //是否展示弹窗
let formTitle = ref(''); //弹窗标题
let othersInfo = ref({}); //弹窗其他信息
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
        value: '0',
      },
      {
        label: '男',
        value: '1',
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
    name: 'identity',
    type: 'select',
    readonly: false,
    options: [
      {
        label: '基础用户',
        value: '1',
      },
      {
        label: 'vip会员',
        value: '2',
      },
      {
        label: '超级管理员',
        value: '3',
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
  if (label === $t('global.btn.detail')) {
    itemVisible.value = true;
    formTitle.value = label;
    othersInfo.value = row;
  } else if (label === $t('global.btn.delete')) {
    handleDelete(row);
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

//关闭弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

//确定
const confirmDialog = () => {
  itemVisible.value = false;
};

// 新增
const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  itemVisible.value = true;
};

// 删除
const handleDelete = (row: any) => {
  console.log('row', row);
  ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
    type: 'warning',
  })
    .then(() => {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: $t('global.message.cancelConfirm'),
      });
    });
};

// 获取用户列表
const getUserList = async (form: any = undefined) => {
  let obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    const res = await getUserListApi(obj);
    list = res.list;
    total.value = res.total;
  } catch (err) {
    console.log(err);
  }
};

onMounted(() => { 
  getUserList();
});
</script>

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
