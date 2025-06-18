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
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handleClick="handleClick"
        @handleCurrentChange="handleCurrentChange"
        @handleSizeChange="handleSizeChange"
      ></Table>
    </el-card>
          <!-- 编辑弹窗 -->
          <Edit
            ref="editForm"
            :formConfig="editConfig"
            :formRules="editRules"
            :title="formTitle"
            :formInfo="othersInfo"
            :visible="itemVisible"
            @close="closeDialog"
            @confirm="confirmDialog"
          ></Edit>
          <!-- 分配用户弹窗 -->
          <SelectPeople
            :visible="userVisible"
            @close="closeUserDialog"
            @confirm="confirmUserDialog"
          ></SelectPeople>
  </div>
</template>

<script lang="ts" setup>
import { getRoleListApi } from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import SelectPeople from '#/components/selectPeople/index.vue';
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
      prop: 'roleName',
      label: $t('global.role.roleName'),
    },
    {
      prop: 'remark',
      label: $t('global.role.remark'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '400px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          show: true,
        },
        {
          type: 'primary',
          label: $t('global.btn.devideUser'),
          show: true,
        },
        {
          type: 'primary',
          label: $t('global.btn.devideAuth'),
          show: true,
        },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
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
      prop: 'roleName',
      label: $t('global.role.roleName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.role.roleName')}`,
    },
  ],
});

//**************edit相关变量**************
let itemVisible = ref(false); //是否展示弹窗
let formTitle = ref(''); //弹窗标题
let othersInfo = ref({}); //弹窗其他信息
// 弹窗表单校验规则
const editRules = reactive({
  roleName: [
    {
      required: true,
      message: $t('global.role.roleName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.role.roleName'),
    name: 'roleName',
    type: 'input',
    readonly: false,
    span: 24,
  },
  {
    label: $t('global.role.remark'),
    name: 'remark',
    type: 'textarea',
    readonly: false,
    span: 24,
  },
]);

//**************分配用户相关变量**************
let userVisible = ref(false); //是否展示弹窗

// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const search = (form: any) => {
  console.log('form', form);
  getRoleList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getRoleList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  if (label === $t('global.btn.edit')) {
    itemVisible.value = true;
    formTitle.value = label;
    othersInfo.value = row;
  } else if (label === $t('global.btn.delete')) {
    handleDelete(row);
  } else if (label === $t('global.btn.devideUser')) {
    console.log('devideUser');
    userVisible.value = true;
  } else if (label === $t('global.btn.devideAuth')) {
    console.log('devideAuth');
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getRoleList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getRoleList();
};

//关闭编辑弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

//确定编辑弹窗
const confirmDialog = () => {
  itemVisible.value = false;
};

//关闭分配用户弹窗
const closeUserDialog = () => {
  userVisible.value = false;
};

//确定分配用户弹窗
const confirmUserDialog = (val: any) => {
  console.log('val', val);
  userVisible.value = false;
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

// 获取角色列表
const getRoleList = async (form: any = undefined) => {
  let obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    const res = await getRoleListApi(obj);
    list = res.list;
    total.value = res.total;
  } catch (err) {
    console.log(err);
  }
};

onMounted(() => { 
  getRoleList();
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
