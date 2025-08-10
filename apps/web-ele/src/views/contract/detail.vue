<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import Detail from '#/components/edit/detail.vue';
import { $t } from '#/locales';
import { getDict } from '#/utils';

const route = useRoute();

const active = ref(0);

// 字典相关
const contractTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 合同类型字典
const paymentCycleDict = reactive<Array<{ label: string; value: any }>>([]); // 合同付款周期字典
const lesseeTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 承租方类型字典
const contractStatusDict = reactive<Array<{ label: string; value: any }>>([]); // 合同状态字典
const itemTypeDict = reactive<Array<{ label: string; value: any }>>([]); // 合同项类型字典

const formInfo = ref({}); // 表单1信息
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
  formInfo.value = {}; // 确保是新的对象引用
});
</script>

<template>
  <div class="detail-view">
    <el-steps
      class="step"
      :active="active"
      finish-status="success"
      align-center
    >
      <el-step title="填写基本信息" />
      <el-step title="完善合同细则" />
      <el-step title="生成预览二维码" />
    </el-steps>
    <div class="pd20">
      <Detail
        ref="detailForm1"
        label-width="120px"
        :form-config="editConfig1"
        :form-rules="editRules1"
        :form-info="formInfo"
      />
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
</style>
