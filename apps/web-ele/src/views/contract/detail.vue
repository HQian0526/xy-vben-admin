<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { ElMessage } from 'element-plus';
import { Plus, Back, CircleCheck } from '@element-plus/icons-vue';
import { addContractApi, addContractItem } from '#/api';
import Detail from '#/components/edit/detail.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { getDict } from '#/utils';

const route = useRoute();

const active = ref(0);

const contractNo = ref(null);

// 字典相关
const contractTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 合同类型字典
const paymentCycleDict = reactive<Array<{ label: string; value: any }>>([]); // 合同付款周期字典
const lesseeTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 承租方类型字典
const contractStatusDict = reactive<Array<{ label: string; value: any }>>([]); // 合同状态字典
const itemTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 合同项类型字典

const formInfo1 = ref({}); // 表单1信息
// 表单1配置
const detailForm1 = ref(null); // 创建 ref
const editConfig1 = reactive([
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
const editRules1 = reactive({
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

// 第二步表格配置
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
      type: 'number',
    },
    {
      prop: 'unitPrice',
      label: $t('global.contract.unitPrice'),
      type: 'number',
    },
    {
      prop: 'specification',
      label: $t('global.contract.specification'),
      type: 'input',
    },
    {
      prop: 'totalPrice',
      label: $t('global.contract.totalPrice'),
      type: 'number',
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

// 第二步表格数据
const editTableList = ref([
  {
    itemName: '',
    itemType: '',
    quantity: '',
    unitPrice: '',
    specification: '',
    totalPrice: '',
    remark: '',
  }
]);

// 点击下一步/确定
const handleConfirm = async (title: String, form: any) => {
  console.log('title', title);
  console.log('form', form);
  // 第一步保存合同基本信息
  if (title === 'step1') {
    // 接口所需其他字段
    const obj = {
      // 出租方类型
      lessorType: Number(import.meta.env.VITE_CONTRACT_LESSOR_TYPE),
      // 出租方名称
      lessorName: import.meta.env.VITE_CONTRACT_LESSOR_NAME,
    };
    try {
      const res = await addContractApi({ ...form, ...obj });
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        contractNo.value = res.data.contractNo;
        if (active.value < 2) {
          active.value++;
        }
      } else {
        ElMessage({
          type: 'error',
          message: res.msg,
        });
      }
    } catch { }
  }
};

// 点击第二步表格操作列按钮
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

// 提交合同项
const submit = async () => {
  console.log('提交合同');
  const valid = validContractItem();
  if (!valid) return;
  const obj = {
    contractNo: contractNo.value,
    items: editTableList.value,
  }
  try {
    const res = await addContractItem(obj);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.saveSuccess'),
      });
      active.value++;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg,
      });
    }
  } catch { }
};

// 表格新增项
const addItem = async () => {
  const valid = validContractItem();
  if (!valid) return;
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

const previous = () => {
  if (active.value > 0) {
    active.value--;
  }
};

// 校验合同项输入
const validContractItem = () => {
  if (editTableList.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: $t('global.message.contractItemIsNull'),
    });
    return false;
  } else {
    let res = true;
    for (let i = 0; i < editTableList.value.length; i++) {
      if (editTableList.value[i]?.itemName === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterItemName'),
        });
        res = false;
        break;
      }
      if (editTableList.value[i]?.quantity === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterItemNumber'),
        });
        res = false;
        break;
      }
      if (editTableList.value[i]?.unitPrice === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterItemUnitPrice'),
        });
        res = false;
        break;
      }
      if (editTableList.value[i]?.totalPrice === '') {
        ElMessage({
          type: 'warning',
          message: $t('global.message.pleaseEnterItemTotalPrice'),
        });
        res = false;
        break;
      }
    }
    return res;
  }
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
  formInfo1.value = {}; // 确保是新的对象引用
});
</script>

<template>
  <div class="detail-view">
    <el-steps class="step" :active="active" finish-status="success" align-center>
      <el-step title="填写基本信息" />
      <el-step title="完善合同细则" />
      <el-step title="生成预览二维码" />
    </el-steps>
    <div class="pd20">
      <Detail ref="detailForm1" v-if="active === 0" label-width="120px" title="step1" :form-config="editConfig1"
        :form-rules="editRules1" :form-info="formInfo1" :confirm-text="$t('global.btn.next')"
        @confirm="handleConfirm" />
      <Table v-if="active === 1" :pagination="false" :table-config="editTableConfig" :list="editTableList"
        @handle-click="editTableClick" />
      <!-- 底部按钮 -->
      <div v-if="active === 1" class="bottom-item">
        <div class="button">
          <div class="cancel">
            <ElButton type="success" :icon="Plus" @click="addItem">{{ $t('global.contract.addContractItem') }}
            </ElButton>
          </div>
          <div class="cancel">
            <ElButton :icon="Back" @click="previous">{{ $t('global.btn.previous') }}</ElButton>
          </div>
          <div class="confirm">
            <ElButton type="primary" :icon="CircleCheck" plain @click="submit">
              {{ $t('global.btn.save') }}
            </ElButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail-view {
  height: calc(100vh - 180px);
  overflow-y: auto;

  .step {
    width: 600px;
    margin: 0 auto;
    margin-top: 20px;
  }
}

.bottom-item {
  width: 100%;
  margin-top: 20px;

  .button {
    display: flex;
    justify-content: center;
    margin: 0 auto;
  }

  .cancel {
    margin-right: 10px;
  }

  .confirm {
    margin-left: 10px;

    .el-button--primary {
      color: #fff;
      background: #2278e9 !important;
      border-color: #2278e9 !important;
    }

    .el-button--primary:hover {
      background: #1890ff !important;
      border-color: #1890ff !important;
    }
  }
}
</style>
