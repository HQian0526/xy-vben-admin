<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addContractTempApi,
  deleteContractTempApi,
  editContractTempApi,
  getContractTempApi,
  previewContractTempApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { getDict } from '#/utils';

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
      prop: 'templateNo',
      label: $t('global.contract.templateNo'),
    },
    {
      prop: 'templateName',
      label: $t('global.contract.templateName'),
    },
    {
      prop: 'templateType',
      label: $t('global.contract.templateType'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'remark',
      label: $t('global.contract.remark'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '250px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
        },
        {
          type: 'success',
          label: $t('global.btn.preview'),
          isShow: () => true,
        },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          isShow: (item: any) => !item.deleted,
        },
      ],
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
const templateTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 模板类型字典
const isCollapsed = ref(false);
// 头部搜索框
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'templateName',
      label: $t('global.contract.templateName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.templateName')}`,
    },
    {
      type: 'select',
      prop: 'deleted',
      label: $t('global.contract.templateType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.templateType')}`,
      options: templateTypeDict,
    },
  ],
});
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.contract.baseInfo'),
    name: '',
    type: 'deliver',
    span: 24,
  },
  {
    label: $t('global.contract.templateNo'),
    name: 'templateNo',
    type: 'input',
    readonly: true,
    placeholder: $t('global.message.systemCreate'),
    span: 12,
  },
  {
    label: $t('global.contract.templateName'),
    name: 'templateName',
    type: 'input',
    span: 12,
  },
  {
    label: $t('global.contract.templateType'),
    name: 'templateType',
    type: 'select',
    options: templateTypeDict,
    span: 24,
  },
  {
    label: $t('global.contract.remark'),
    name: 'remark',
    type: 'textarea',
    span: 24,
  },
  {
    label: $t('global.contract.uploadTemp'),
    name: 'fileList',
    type: 'uploadFile',
    span: 24,
    limit: 1,
    accept: '.doc, .docx, .pdf',
  },
  {
    label: $t('global.contract.variable'),
    name: '',
    type: 'deliver',
    span: 24,
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  templateName: [
    {
      required: true,
      message: $t('global.contract.templateName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});
// 弹窗内表格配置
const variableDict = reactive<Array<{ label: string; value: any }>>([]); // 模板变量来源字典
const editTableConfig = reactive({
  list: [
    {
      prop: 'index',
    },
    {
      prop: 'variableName',
      label: $t('global.contract.variableName'),
      type: 'input',
    },
    {
      prop: 'dataSource',
      label: $t('global.contract.dataSource'),
      type: 'select',
      options: variableDict
    },
    {
      prop: 'fieldPath',
      label: $t('global.contract.fieldPath'),
      type: 'input',
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '100px',
      operations: [
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          show: true,
        },
      ],
    },
  ],
});
// 弹窗内表格数据
const editTableList = ref([
  {
    variableName: '',
    dataSource: '',
    fieldPath: '',
  }
]);

// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const search = (form: any) => {
  console.log('form', form);
  getContractTempList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getContractTempList(form);
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
      formInfo.value = {
        ...row,
        fileList: [{
          name: row.fileName,
          url: row.filePath,
          status: 'success',
          uid: row.fileId,
          size: Number(row.fileSize),
        }]
      }; // 确保是新的对象引用
      console.log('formIfo', formInfo.value)
      editTableList.value = JSON.parse(row.variablesConfig);
      itemVisible.value = true;
      break;
    }
    // 预览
    case $t('global.btn.preview'): {
      handlePreview(row);
      break;
    }
    // 删除
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
    // No default
  }
};

// 点击弹窗内表格操作列按钮
const editTableClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  if (label === $t('global.btn.delete')) {
    const index = editTableList.value.indexOf(row);
    if (index !== -1) {
      editTableList.value.splice(index, 1);
    }
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getContractTempList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getContractTempList();
};

// 关闭编辑弹窗
const closeDialog = () => {
  editTableList.value = []; // 使用 ref 时这样清空
  formInfo.value = {}; // 同时清空表单数据
  itemVisible.value = false;
};

// 确定编辑弹窗
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  const valid = validEditTable();
  if (!valid) return;
  const obj = {
    // 合同模板
    fileId: data.fileList.map((item: any) => item.uid).join(','),
    fileName: data.fileList.map((item: any) => item.name).join(','),
    filePath: data.fileList.map((item: any) => item.url).join(','),
    fileSize: data.fileList.map((item: any) => item.size).join(','),
    variablesConfig: JSON.stringify(editTableList.value),
  };
  try {
    const res =
      title === $t('global.btn.add')
        ? await addContractTempApi({ ...data, ...obj })
        : await editContractTempApi({ ...data, ...obj });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getContractTempList();
      itemVisible.value = false;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg,
      });
    }
  } catch { }
};

// 新增
const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  formInfo.value = {}; // 清空表单数据
  editTableList.value = []; // 明确清空表格数据
  itemVisible.value = true;
};

// 弹窗内表格新增项
const editTableAdd = async () => {
  const valid = validEditTable();
  if (!valid) return;
  editTableList.value.push({
    variableName: '',
    dataSource: '',
    fieldPath: '',
  });
};

// 校验合同项输入
const validEditTable = () => {
  if (editTableList.value.length === 0) {
    return true;
  } else {
    let res = true;
    for (let i = 0; i < editTableList.value.length; i++) {
      if (editTableList.value[i]?.variableName === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterVariableName'),
        });
        res = false;
        break;
      }
      if (editTableList.value[i]?.dataSource === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterDataSource'),
        });
        res = false;
        break;
      }
      if (editTableList.value[i]?.fieldPath === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterItemUnitPrice'),
        });
        res = false;
        break;
      }
    }
    return res;
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
      const res = await deleteContractTempApi([String(row.id)]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getContractTempList();
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

// 预览合同模板
const handlePreview = (row: any) => {
  // 构建预览URL
  const previewUrl = `/api/contract-template/previewTemp/${row.templateNo}`;
  // 在新窗口打开预览
  window.open(previewUrl, '_blank');
};

// 获取合同模板列表
const getContractTempList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getContractTempApi(obj);
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

onMounted(async () => {
  getContractTempList(); // 获取合同模板列表
  // 获取合同模板类型字典值
  const dict1 = await getDict('contract_type');
  templateTypeDict.splice(0, templateTypeDict.length, ...dict1);
  // 获取合同模板变量数据来源字典值
  const dict2 = await getDict('contract_template_sourse');
  variableDict.splice(0, variableDict.length, ...dict2);
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
      <Table :table-config="tableConfig" :list="list" :total="total" @handle-click="handleClick"
        @handle-current-change="handleCurrentChange" @handle-size-change="handleSizeChange" />
    </el-card>
    <!-- 编辑弹窗 -->
    <Edit ref="editForm" label-width="100px" :form-config="editConfig" :form-rules="editRules" :title="formTitle"
      :form-info="formInfo" :visible="itemVisible" @close="closeDialog" @confirm="confirmDialog">
      <template #slot>
        <!-- 弹窗内的表格 -->
        <el-button type="primary" @click="editTableAdd">
          {{ $t('global.btn.addVariable') }}
        </el-button>
        <Table :pagination="false" :table-config="editTableConfig" :list="editTableList"
          @handle-click="editTableClick" />
      </template>
    </Edit>
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
