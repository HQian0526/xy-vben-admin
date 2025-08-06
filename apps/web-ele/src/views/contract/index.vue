<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addContractApi,
  deleteContractApi,
  editContractApi,
  getContractListApi,
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
      prop: 'contractNo',
      label: $t('global.contract.contractNo'),
    },
    {
      prop: 'contractName',
      label: $t('global.contract.contractName'),
    },
    {
      prop: 'contractType',
      label: $t('global.contract.contractType'),
      filter: (value: any) => {
        if (value === 1) return $t('global.contract.leaseContract');
        if (value === 2) return $t('global.contract.salesContract');
      },
    },
    {
      prop: 'totalAmount',
      label: $t('global.contract.totalAmount'),
    },
    {
      prop: 'lesseeName',
      label: $t('global.contract.lesseeName'),
    },
    {
      prop: 'startDate',
      label: $t('global.contract.startDate'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'contractStatus',
      label: $t('global.contract.contractStatus'),
      filter: (value: any) => {
        if (value === 1) return $t('global.contract.unsigned');
        if (value === 2) return $t('global.contract.signed');
        if (value === 3) return $t('global.contract.expired');
        if (value === 4) return $t('global.contract.finished');
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
      width: '200px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
        },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          isShow: () => true,
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
      prop: 'contractName',
      label: $t('global.contract.contractName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.contractName')}`,
    },
    {
      type: 'select',
      prop: 'contractType',
      label: $t('global.contract.contractType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.contractType')}`,
      options: [
        {
          label: $t('global.contract.leaseContract'),
          value: 1,
        },
        {
          label: $t('global.contract.salesContract'),
          value: 2,
        },
      ],
    },
    {
      type: 'select',
      prop: 'contractStatus',
      label: $t('global.contract.contractType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.contractStatus')}`,
      options: [
        {
          label: $t('global.contract.unsigned'),
          value: 1,
        },
        {
          label: $t('global.contract.signed'),
          value: 2,
        },
        {
          label: $t('global.contract.expired'),
          value: 3,
        },
        {
          label: $t('global.contract.finished'),
          value: 4,
        },
      ],
    },
  ],
});
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
const contractTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 合同类型字典
const paymentCycleDict = reactive<Array<{ label: string; value: any }>>([]); // 合同付款周期字典
const lesseeTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 承租方类型字典
const contractStatusDict = reactive<Array<{ label: string; value: any }>>([]); // 合同状态字典
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.contract.contractName'),
    name: 'contractName',
    type: 'input',
    span: 12,
  },
  {
    label: $t('global.contract.contractType'),
    name: 'contractType',
    type: 'select',
    span: 12,
    options: contractTypeDict,
  },
  {
    label: $t('global.contract.totalAmount'),
    name: 'totalAmount',
    type: 'number',
    span: 12,
  },
  {
    label: $t('global.contract.paymentCycle'),
    name: 'paymentCycle',
    type: 'select',
    span: 12,
    options: paymentCycleDict,
  },
  {
    label: $t('global.contract.startDate'),
    name: 'startDate',
    type: 'date',
    span: 12,
  },
  {
    label: $t('global.contract.endDate'),
    name: 'endDate',
    type: 'date',
    span: 12,
  },
  {
    label: $t('global.contract.lesseeType'),
    name: 'lesseeType',
    type: 'select',
    span: 12,
    options: lesseeTypeDict,
  },
  {
    label: $t('global.contract.lesseeName'),
    name: 'lesseeName',
    type: 'input',
    span: 12,
  },
  {
    label: $t('global.contract.contractStatus'),
    name: 'contractStatus',
    type: 'select',
    span: 12,
    options: contractStatusDict,
  },
  {
    label: $t('global.contract.remark'),
    name: 'remark',
    type: 'textarea',
    span: 12,
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  contractName: [
    {
      required: true,
      message: $t('global.contract.contractName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  contractType: [
    {
      required: true,
      message: $t('global.contract.contractType') + $t('global.required'),
      trigger: 'change',
    },
  ],
  totalAmount: [
    {
      required: true,
      message: $t('global.contract.totalAmount') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  paymentCycle: [
    {
      required: true,
      message: $t('global.contract.paymentCycle') + $t('global.required'),
      trigger: 'change',
    },
  ],
  startDate: [
    {
      required: true,
      message: $t('global.contract.startDate') + $t('global.required'),
      trigger: 'change',
    },
  ],
  lesseeType: [
    {
      required: true,
      message: $t('global.contract.lesseeType') + $t('global.required'),
      trigger: 'change',
    },
  ],
  lesseeName: [
    {
      required: true,
      message: $t('global.contract.lesseeName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});
const itemTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 合同项类型字典
// 弹窗内表格配置
const editTableConfig = reactive({
  list: [
    {
      prop: 'index',
    },
    {
      prop: 'itemName',
      label: $t('global.contract.itemName'),
      type: 'input',
    },
    {
      prop: 'itemType',
      label: $t('global.contract.itemType'),
      type: 'select',
      options: itemTypeDict,
    },
    {
      prop: 'quantity',
      label: $t('global.contract.quantity'),
      type: 'input',
    },
    {
      prop: 'unitPrice',
      label: $t('global.contract.unitPrice'),
      type: 'input',
    },
    {
      prop: 'specification',
      label: $t('global.contract.specification'),
      type: 'input',
    },
    {
      prop: 'totalPrice',
      label: $t('global.contract.totalPrice'),
      type: 'input',
    },
    {
      prop: 'remark',
      label: $t('global.contract.remark'),
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
const editTableList = ref([]);

// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const search = (form: any) => {
  console.log('form', form);
  getContractList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getContractList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    // 删除
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
    // 编辑
    case $t('global.btn.edit'): {
      // 编辑
      formTitle.value = label;
      formInfo.value = {
        ...row,
      }; // 确保是新的对象引用
      itemVisible.value = true;
      break;
    }
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getContractList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getContractList();
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
  // 接口所需其他字段
  const obj = {
    // 出租方类型
    lessorType: Number(import.meta.env.VITE_CONTRACT_LESSOR_TYPE),
    // 出租方名称
    lessorName: import.meta.env.VITE_CONTRACT_LESSOR_NAME,
  };
  console.log('obj', obj);
  try {
    const res =
      title === $t('global.btn.add')
        ? await addContractApi({ ...data, ...obj })
        : await editContractApi({ ...data, ...obj });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getContractList();
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
  editTableList.value = []; // 明确清空表格数据
  itemVisible.value = true;
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
      const res = await deleteContractApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getContractList();
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

// 获取区域列表
const getContractList = async (form: any = undefined) => {
  const obj = {
    ...form,
    deleted: 0,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getContractListApi(obj);
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

// 弹窗内表格新增项
const editTableAdd = async () => {
  editTableList.value.push({
    itemName: '',
    itemType: '',
    quantity: '',
    unitPrice: '',
    specification: '',
    totalPrice: '',
    remark: '',
  });
};

onMounted(async () => {
  // 获取合同类型字典值
  const dict1 = await getDict('contract_type');
  contractTypeDict.splice(0, contractTypeDict.length, ...dict1);
  // 获取合同付款周期字典值
  const dict2 = await getDict('payment_cycle');
  paymentCycleDict.splice(0, paymentCycleDict.length, ...dict2);
  // 获取承租方类型字典值
  const dict3 = await getDict('lessor_type');
  lesseeTypeDict.splice(0, lesseeTypeDict.length, ...dict3);
  // 获取合同状态字典值
  const dict4 = await getDict('contract_status');
  contractStatusDict.splice(0, contractStatusDict.length, ...dict4);
  // 获取合同项类型字典值
  const dict5 = await getDict('contract_item_type');
  itemTypeDict.splice(0, itemTypeDict.length, ...dict5);
  getContractList(); // 获取区域列表
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
      label-width="120px"
      :form-config="editConfig"
      :form-rules="editRules"
      :title="formTitle"
      :form-info="formInfo"
      :visible="itemVisible"
      @close="closeDialog"
      @confirm="confirmDialog"
    >
      <template #slot>
        <!-- 弹窗内的表格 -->
        <el-button type="primary" @click="editTableAdd">
          {{ $t('global.contract.addContractItem') }}
        </el-button>
        <Table
          :pagination="false"
          :table-config="editTableConfig"
          :list="editTableList"
          @handle-click="editTableClick"
        />
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
