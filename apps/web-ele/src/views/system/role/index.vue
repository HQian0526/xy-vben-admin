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
    <!-- 弹窗 -->
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
  </div>
</template>

<script lang="ts" setup>
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { ElButton, ElCard, ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref } from 'vue';
//table相关变量
let total = ref(10);
//filter相关变量
const isCollapsed = ref(false);
//edit相关变量
let itemVisible = ref(false); //是否展示弹窗
let formTitle = ref(''); //弹窗标题
let othersInfo = ref({}); //弹窗其他信息
// 弹窗表单校验规则
const editRules = reactive({
  dictName: [
    {
      required: true,
      message: $t('global.dict.dictName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  code: [
    {
      required: true,
      message: $t('global.dict.code') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.dict.code'),
    name: 'code',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.dict.dictName'),
    name: 'dictName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.dict.remark'),
    name: 'remark',
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
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
};

// 头部搜索框
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'dictName',
      label: $t('global.dict.dictName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.dict.dictName')}`,
    },
    {
      type: 'input',
      prop: 'code',
      label: $t('global.dict.code'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.dict.code')}`,
    },
  ],
});

// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'index',
    },
    {
      prop: 'code',
      label: $t('global.dict.code'),
    },
    {
      prop: 'dictName',
      label: $t('global.dict.dictName'),
    },
    {
      prop: 'remark',
      label: $t('global.dict.remark'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '200px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.detail'),
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
let list = reactive([
  {
    code: 'sex',
    dictName: '性别',
    remark: '性别字典',
  },
  {
    code: 'sex',
    dictName: '性别',
    remark: '性别字典',
  },
  {
    code: 'sex',
    dictName: '性别',
    remark: '性别字典',
  },
]);

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  if (label === $t('global.btn.detail')) {
    itemVisible.value = true;
    formTitle.value = '详情';
    othersInfo.value = row;
  } else if (label === $t('global.btn.delete')) {
    handleDelete(row);
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
};

//关闭弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

//确定
const confirmDialog = () => {
  itemVisible.value = true;
};

// 新增
const handleAdd = () => {
  formTitle.value = '添加';
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
