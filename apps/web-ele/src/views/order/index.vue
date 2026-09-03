<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import {
  getMallOrderDetailApi,
  getMallOrderListApi,
  getStoreListApi,
  refundMallOrderApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { resolveFileUrl } from '#/utils';

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
const storeDict = reactive<Array<{ label: string; value: any }>>([]); // 所属商户下拉

const payStatusMap: Record<number, string> = {
  0: $t('global.order.pendingPay'),
  1: $t('global.order.paid'),
  2: $t('global.order.closed'),
  3: $t('global.order.refunding'),
  4: $t('global.order.partialRefund'),
  5: $t('global.order.fullRefund'),
};

// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'orderNo',
      label: $t('global.order.orderNo'),
      width: '190px',
    },
    {
      prop: 'storeName',
      label: $t('global.order.storeName'),
    },
    {
      prop: 'contact',
      label: $t('global.order.contact'),
      width: '120px',
    },
    {
      prop: 'payAmount',
      label: $t('global.order.payAmount'),
      width: '100px',
    },
    {
      prop: 'payStatus',
      label: $t('global.order.payStatus'),
      width: '110px',
      filter: (value: any) => {
        return payStatusMap[Number(value)] ?? value;
      },
    },
    {
      prop: 'paidTime',
      label: $t('global.order.paidTime'),
      width: '170px',
      filter: (value: any) => {
        return value || '--';
      },
    },
    {
      prop: 'refundAmount',
      label: $t('global.order.refundAmount'),
      width: '110px',
      filter: (value: any) => {
        return value == null || value === '' ? '0' : value;
      },
    },
    {
      prop: 'address',
      label: $t('global.order.address'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '170px',
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '200px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.viewProducts'),
          isShow: () => true,
        },
        {
          type: 'danger',
          label: $t('global.btn.refund'),
          // 已支付、部分退款可继续退
          isShow: (item: any) =>
            Number(item.payStatus) === 1 || Number(item.payStatus) === 4,
        },
      ],
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
const formConfig = reactive({
  list: [
    {
      type: 'select',
      prop: 'payStatus',
      label: $t('global.order.payStatus'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.order.payStatus')}`,
      options: [
        { label: $t('global.order.pendingPay'), value: '0' },
        { label: $t('global.order.paid'), value: '1' },
        { label: $t('global.order.closed'), value: '2' },
        { label: $t('global.order.refunding'), value: '3' },
        { label: $t('global.order.partialRefund'), value: '4' },
        { label: $t('global.order.fullRefund'), value: '5' },
      ],
    },
  ] as Array<Record<string, any>>,
});

//* *************查看商品相关**************
const productVisible = ref(false);
const productLoading = ref(false);
const productList = ref<any[]>([]);
const productOrderNo = ref('');

//* *************退款相关**************
const refundVisible = ref(false);
const refundSubmitting = ref(false);
const currentOrder = ref<Record<string, any>>({});
const refundForm = reactive({
  fullRefund: true,
  refundAmount: undefined as number | undefined,
  reason: '',
});

const remainRefundAmount = computed(() => {
  const payFen = Number(currentOrder.value?.payAmountFen);
  const refundedFen = Number(currentOrder.value?.refundAmountFen) || 0;
  if (Number.isFinite(payFen) && payFen > 0) {
    return Number(((payFen - refundedFen) / 100).toFixed(2));
  }
  const pay = Number(currentOrder.value?.payAmount) || 0;
  const refunded = Number(currentOrder.value?.refundAmount) || 0;
  return Number(Math.max(0, pay - refunded).toFixed(2));
});

watch(
  () => refundForm.fullRefund,
  (full) => {
    if (full) {
      refundForm.refundAmount = remainRefundAmount.value;
    } else {
      refundForm.refundAmount = undefined;
    }
  },
);

const search = (form: any) => {
  console.log('form', form);
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getOrderList();
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getOrderList();
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    case $t('global.btn.viewProducts'): {
      handleViewProducts(row);
      break;
    }
    case $t('global.btn.refund'): {
      handleOpenRefund(row);
      break;
    }
    // No default
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getOrderList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getOrderList();
};

// 获取商户下拉（仅管理员）
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

// 获取订单列表
const getOrderList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  // 非管理员不传 storeId，由后端按身份限制本店/本人
  if (!isAdmin.value) {
    delete obj.storeId;
  }
  try {
    isLoading.value = true;
    const res = await getMallOrderListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...(res.data.list || [])); // 添加新数据
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

// 查看商品
const handleViewProducts = async (row: any) => {
  productOrderNo.value = row.orderNo || '';
  productVisible.value = true;
  productList.value = [];
  // 列表里已带 items 时直接展示；否则再查详情
  if (Array.isArray(row.items) && row.items.length > 0) {
    productList.value = row.items;
    return;
  }
  if (!row.orderNo) return;
  productLoading.value = true;
  try {
    const res = await getMallOrderDetailApi(row.orderNo);
    if (res.code === 200) {
      productList.value = res.data?.items || [];
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || $t('global.message.error'),
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    productLoading.value = false;
  }
};

const closeProductDialog = () => {
  productVisible.value = false;
  productList.value = [];
  productOrderNo.value = '';
};

// 打开退款弹窗
const handleOpenRefund = (row: any) => {
  currentOrder.value = { ...row };
  refundForm.fullRefund = true;
  refundForm.refundAmount = remainRefundAmount.value;
  refundForm.reason = '';
  refundVisible.value = true;
};

const closeRefundDialog = () => {
  refundVisible.value = false;
  currentOrder.value = {};
  refundForm.fullRefund = true;
  refundForm.refundAmount = undefined;
  refundForm.reason = '';
};

// 确认退款
const confirmRefund = async () => {
  if (refundSubmitting.value) return;
  const orderNo = currentOrder.value?.orderNo;
  if (!orderNo) return;

  if (!refundForm.fullRefund) {
    const amount = Number(refundForm.refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      ElMessage({
        type: 'warning',
        message: $t('global.order.pleaseEnterRefundAmount'),
      });
      return;
    }
    if (amount > remainRefundAmount.value) {
      ElMessage({
        type: 'warning',
        message: $t('global.order.refundAmountInvalid'),
      });
      return;
    }
  }

  refundSubmitting.value = true;
  try {
    const payload: Record<string, any> = {
      orderNo,
      fullRefund: refundForm.fullRefund,
      reason: refundForm.reason || undefined,
    };
    if (!refundForm.fullRefund) {
      payload.refundAmount = Number(refundForm.refundAmount);
    }
    const res = await refundMallOrderApi(payload);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      closeRefundDialog();
      getOrderList();
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || $t('global.message.error'),
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    refundSubmitting.value = false;
  }
};

onMounted(async () => {
  // 仅管理员展示「所属商户」筛选
  if (isAdmin.value) {
    formConfig.list.unshift({
      type: 'select',
      prop: 'storeId',
      label: $t('global.order.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.order.storeName')}`,
      options: storeDict,
    });
    await getStoreList();
  }
  getOrderList();
});
</script>

<template>
  <div v-loading="isLoading" class="order-page pd5">
    <el-card class="filter-card">
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
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

    <!-- 查看商品弹窗 -->
    <el-dialog
      v-model="productVisible"
      :title="$t('global.order.productList')"
      width="720px"
      :append-to-body="true"
      :close-on-click-modal="false"
      @close="closeProductDialog"
    >
      <div v-if="productOrderNo" class="product-order-no">
        {{ $t('global.order.orderNo') }}：{{ productOrderNo }}
      </div>
      <el-table
        v-loading="productLoading"
        :data="productList"
        border
        style="width: 100%"
      >
        <el-table-column
          :label="$t('global.order.productImg')"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-image
              v-if="row.productImg"
              :src="resolveFileUrl(row.productImg)"
              :preview-src-list="[resolveFileUrl(row.productImg)]"
              fit="cover"
              style="width: 50px; height: 50px"
            />
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="productName"
          :label="$t('global.order.productName')"
          min-width="160"
        />
        <el-table-column
          prop="price"
          :label="$t('global.order.price')"
          width="100"
        />
        <el-table-column
          prop="quantity"
          :label="$t('global.order.quantity')"
          width="80"
        />
        <el-table-column
          prop="amount"
          :label="$t('global.order.amount')"
          width="100"
        />
      </el-table>
    </el-dialog>

    <!-- 退款弹窗 -->
    <el-dialog
      v-model="refundVisible"
      :title="$t('global.btn.refund')"
      width="460px"
      :append-to-body="true"
      :close-on-click-modal="false"
      @close="closeRefundDialog"
    >
      <el-form label-width="100px">
        <el-form-item :label="$t('global.order.orderNo')">
          <span>{{ currentOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.order.payAmount')">
          <span>{{ currentOrder.payAmount }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.order.remainRefund')">
          <span class="remain-amount">{{ remainRefundAmount }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.order.refundType')">
          <el-radio-group v-model="refundForm.fullRefund">
            <el-radio :value="true">
              {{ $t('global.order.fullRefundType') }}
            </el-radio>
            <el-radio :value="false">
              {{ $t('global.order.partialRefundType') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('global.order.refundMoney')">
          <el-input-number
            v-model="refundForm.refundAmount"
            :min="0.01"
            :max="remainRefundAmount"
            :precision="2"
            :step="0.01"
            :disabled="refundForm.fullRefund"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="$t('global.order.refundReason')">
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="2"
            :placeholder="$t('global.pleaseEnter') + $t('global.order.refundReason')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeRefundDialog">
          {{ $t('global.btn.cancel') }}
        </el-button>
        <el-button
          type="danger"
          :loading="refundSubmitting"
          @click="confirmRefund"
        >
          {{ $t('global.order.confirmRefund') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.filter-card {
  flex-shrink: 0;
}

.table-box {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
  }
}

.product-order-no {
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
}

.remain-amount {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>
