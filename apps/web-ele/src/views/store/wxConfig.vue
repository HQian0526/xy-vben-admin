<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  getStoreWxConfigApi,
  getStoreWxConfigListApi,
  saveStoreMiniappUiApi,
  saveStoreWxConfigApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(() => Number(userStore.userInfo?.identityType) === 3);

const isLoading = ref(false);
const saving = ref(false);
const allRows = ref<any[]>([]);
const list = reactive<any[]>([]);
const searchParams = ref<Record<string, any>>({});
const storeDict = reactive<Array<{ label: string; value: any }>>([]);
const dialogVisible = ref(false);
const uiDialogVisible = ref(false);
const uiSaving = ref(false);
const form = reactive({
  storeId: '',
  storeName: '',
  enabled: 1,
  appId: '',
  appSecret: '',
  mchId: '',
  apiV3Key: '',
  merchantSerialNumber: '',
  privateKey: '',
  publicKey: '',
  publicKeyId: '',
  notifyUrl: '',
  refundNotifyUrl: '',
  hasAppSecret: false,
  hasApiV3Key: false,
  hasPrivateKey: false,
  hasPublicKey: false,
  miniappReady: false,
  payReady: false,
  platformFallback: true,
});
const uiForm = reactive({
  storeId: '',
  storeName: '',
  miniappType: 1,
  showStock: 1,
  showAddress: 1,
  showQuantity: 1,
  showCart: 1,
  enablePay: 1,
  enableRecharge: 1,
  orderBtnText: '立即购买',
  homeTabText: '逛店',
  listBtnText: '预定',
  showSaleNum: 1,
  showDeliveryFee: 1,
});

function mallUiPreset() {
  return {
    miniappType: 1,
    showStock: 1,
    showAddress: 1,
    showQuantity: 1,
    showCart: 1,
    showSaleNum: 1,
    showDeliveryFee: 1,
    orderBtnText: '立即购买',
    homeTabText: '逛店',
    listBtnText: '预定',
  };
}

function bookingUiPreset() {
  return {
    miniappType: 2,
    showStock: 0,
    showAddress: 0,
    showQuantity: 0,
    showCart: 0,
    showSaleNum: 0,
    showDeliveryFee: 0,
    orderBtnText: '立即预约',
    homeTabText: '预约',
    listBtnText: '预定',
  };
}

const formConfig = reactive({
  list: [
    {
      type: 'select',
      prop: 'storeId',
      label: $t('global.wxConfig.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.wxConfig.storeName')}`,
      options: storeDict,
    },
  ] as Array<Record<string, any>>,
});

const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.wxConfig.storeName'),
      minWidth: '140px',
    },
    {
      prop: 'appId',
      label: $t('global.wxConfig.appId'),
      minWidth: '160px',
    },
    {
      prop: 'mchId',
      label: $t('global.wxConfig.mchId'),
      minWidth: '140px',
    },
    {
      prop: 'modeLabel',
      label: $t('global.wxConfig.mode'),
      width: '120px',
    },
    {
      prop: 'miniappLabel',
      label: $t('global.wxConfig.miniapp'),
      width: '110px',
    },
    {
      prop: 'payLabel',
      label: $t('global.wxConfig.pay'),
      width: '110px',
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
          width: '300px',
      operations: [
        {
          type: 'primary',
          label: $t('global.wxConfig.payConfig'),
          isShow: () => true,
        },
        {
          type: 'success',
          label: $t('global.wxConfig.miniappUi'),
          isShow: () => true,
        },
      ],
    },
  ],
});

function mapRow(item: any) {
  const platform = item.platformFallback !== false && !item.payReady;
  return {
    ...item,
    modeLabel: platform
      ? $t('global.wxConfig.platform')
      : $t('global.wxConfig.buyout'),
    miniappLabel: item.miniappReady
      ? $t('global.wxConfig.ready')
      : $t('global.wxConfig.notReady'),
    payLabel: item.payReady
      ? $t('global.wxConfig.ready')
      : $t('global.wxConfig.notReady'),
  };
}

function applyFilter() {
  const storeId = searchParams.value.storeId;
  const id =
    storeId === undefined || storeId === null || storeId === ''
      ? ''
      : String(storeId);
  const rows = allRows.value.filter((item) => {
    if (!id) {
      return true;
    }
    return String(item.storeId) === id;
  });
  list.splice(0, list.length, ...rows);
}

const getList = async () => {
  if (!isAdmin.value) {
    allRows.value = [];
    storeDict.splice(0, storeDict.length);
    list.splice(0, list.length);
    return;
  }
  isLoading.value = true;
  try {
    const res = await getStoreWxConfigListApi();
    if (res.code === 200) {
      allRows.value = (res.data || []).map((item: any) => mapRow(item));
      storeDict.splice(
        0,
        storeDict.length,
        ...allRows.value.map((item: any) => ({
          label: item.storeName,
          value: String(item.storeId),
          keepValue: true,
        })),
      );
      applyFilter();
    } else {
      ElMessage.error(res.msg || $t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const search = (params: Record<string, any>) => {
  searchParams.value = params || {};
  applyFilter();
};

const reset = () => {
  searchParams.value = {};
  applyFilter();
};

function fillForm(detail: any) {
  form.storeId = detail.storeId == null ? '' : String(detail.storeId);
  form.storeName = detail.storeName || '';
  form.enabled = Number(detail.enabled) === 0 ? 0 : 1;
  form.appId = detail.appId || '';
  form.appSecret = '';
  form.mchId = detail.mchId || '';
  form.apiV3Key = '';
  form.merchantSerialNumber = detail.merchantSerialNumber || '';
  form.privateKey = '';
  form.publicKey = '';
  form.publicKeyId = detail.publicKeyId || '';
  form.notifyUrl = detail.notifyUrl || '';
  form.refundNotifyUrl = detail.refundNotifyUrl || '';
  form.hasAppSecret = !!detail.hasAppSecret;
  form.hasApiV3Key = !!detail.hasApiV3Key;
  form.hasPrivateKey = !!detail.hasPrivateKey;
  form.hasPublicKey = !!detail.hasPublicKey;
  form.miniappReady = !!detail.miniappReady;
  form.payReady = !!detail.payReady;
  form.platformFallback = detail.platformFallback !== false;
}

function fillUiForm(detail: any) {
  const type = Number(detail.miniappType) === 2 ? 2 : 1;
  const preset = type === 2 ? bookingUiPreset() : mallUiPreset();
  uiForm.storeId = detail.storeId == null ? '' : String(detail.storeId);
  uiForm.storeName = detail.storeName || '';
  uiForm.miniappType = type;
  uiForm.showStock = detail.showStock == null ? preset.showStock : Number(detail.showStock) === 1 ? 1 : 0;
  uiForm.showAddress = detail.showAddress == null ? preset.showAddress : Number(detail.showAddress) === 1 ? 1 : 0;
  uiForm.showQuantity = detail.showQuantity == null ? preset.showQuantity : Number(detail.showQuantity) === 1 ? 1 : 0;
  uiForm.showCart = detail.showCart == null ? preset.showCart : Number(detail.showCart) === 1 ? 1 : 0;
  uiForm.showSaleNum = detail.showSaleNum == null ? preset.showSaleNum : Number(detail.showSaleNum) === 1 ? 1 : 0;
  uiForm.showDeliveryFee = detail.showDeliveryFee == null ? preset.showDeliveryFee : Number(detail.showDeliveryFee) === 1 ? 1 : 0;
  uiForm.enablePay = detail.enablePay == null ? 1 : Number(detail.enablePay) === 1 ? 1 : 0;
  // 未接入支付时储值无意义，按关闭展示
  const payOn = Number(uiForm.enablePay) === 1;
  let rechargeSaved = 1;
  if (
    detail.enableRecharge !== null &&
    detail.enableRecharge !== undefined &&
    Number(detail.enableRecharge) !== 1
  ) {
    rechargeSaved = 0;
  }
  uiForm.enableRecharge = payOn ? rechargeSaved : 0;
  uiForm.orderBtnText = String(detail.orderBtnText || preset.orderBtnText).trim() || preset.orderBtnText;
  uiForm.homeTabText = String(detail.homeTabText || preset.homeTabText).trim() || preset.homeTabText;
  uiForm.listBtnText = String(detail.listBtnText || preset.listBtnText).trim() || preset.listBtnText;
}

/**
 * 关闭支付时储值没有意义，联动关闭。
 * 若原本开着储值，同样要提醒会员余额将不可用。
 */
const onEnablePayChange = async (value: any) => {
  if (Number(value) === 1) {
    return;
  }
  const rechargeWasOn = Number(uiForm.enableRecharge) === 1;
  uiForm.enableRecharge = 0;
  if (!rechargeWasOn) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      $t('global.wxConfig.confirmDisableRecharge'),
      $t('global.tip'),
      {
        type: 'warning',
        confirmButtonText: $t('global.btn.confirm'),
        cancelButtonText: $t('global.btn.cancel'),
      },
    );
  } catch {
    // 用户取消：支付与储值一并恢复
    uiForm.enablePay = 1;
    uiForm.enableRecharge = 1;
  }
};

/**
 * 关闭储值前二次确认：提醒关闭后所有储值会员的余额将无法使用。
 * 取消时把开关恢复为开启。
 */
const onEnableRechargeChange = async (value: any) => {
  if (Number(value) === 1) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      $t('global.wxConfig.confirmDisableRecharge'),
      $t('global.tip'),
      {
        type: 'warning',
        confirmButtonText: $t('global.btn.confirm'),
        cancelButtonText: $t('global.btn.cancel'),
      },
    );
  } catch {
    // 用户取消：恢复开关
    uiForm.enableRecharge = 1;
  }
};

const onMiniappTypeChange = (value: number) => {
  const preset = Number(value) === 2 ? bookingUiPreset() : mallUiPreset();
  Object.assign(uiForm, preset, {
    storeId: uiForm.storeId,
    storeName: uiForm.storeName,
    enablePay: uiForm.enablePay,
    listBtnText: uiForm.listBtnText || preset.listBtnText,
  });
};

const openEdit = async (row: any) => {
  try {
    const res = await getStoreWxConfigApi(row.storeId);
    if (res.code !== 200) {
      ElMessage.error(res.msg || $t('global.message.searchError'));
      return;
    }
    fillForm(res.data || row);
    dialogVisible.value = true;
  } catch (error) {
    console.log(error);
  }
};

const openUi = async (row: any) => {
  try {
    const res = await getStoreWxConfigApi(row.storeId);
    if (res.code !== 200) {
      ElMessage.error(res.msg || $t('global.message.searchError'));
      return;
    }
    fillUiForm(res.data || row);
    uiDialogVisible.value = true;
  } catch (error) {
    console.log(error);
  }
};

const handleClick = (row: any, label: string) => {
  if (label === $t('global.wxConfig.payConfig')) {
    openEdit(row);
    return;
  }
  if (label === $t('global.wxConfig.miniappUi')) {
    openUi(row);
  }
};

const confirmUiDialog = async () => {
  if (!uiForm.storeId) {
    ElMessage.error(
      $t('global.pleaseSelect') + $t('global.wxConfig.storeName'),
    );
    return;
  }
  if (uiForm.miniappType !== 1 && uiForm.miniappType !== 2) {
    ElMessage.error($t('global.wxConfig.typeRequired'));
    return;
  }
  const orderBtnText = String(uiForm.orderBtnText || '').trim();
  if (!orderBtnText) {
    ElMessage.error(
      $t('global.pleaseEnter') + $t('global.wxConfig.orderBtnText'),
    );
    return;
  }
  const homeTabText = String(uiForm.homeTabText || '').trim();
  if (!homeTabText) {
    ElMessage.error(
      $t('global.pleaseEnter') + $t('global.wxConfig.homeTabText'),
    );
    return;
  }
  const listBtnText = String(uiForm.listBtnText || '').trim();
  if (!listBtnText) {
    ElMessage.error(
      $t('global.pleaseEnter') + $t('global.wxConfig.listBtnText'),
    );
    return;
  }
  uiSaving.value = true;
  try {
    const res = await saveStoreMiniappUiApi({
      storeId: uiForm.storeId,
      miniappType: Number(uiForm.miniappType),
      showStock: Number(uiForm.showStock),
      showAddress: Number(uiForm.showAddress),
      showQuantity: Number(uiForm.showQuantity),
      showCart: Number(uiForm.showCart),
      showSaleNum: Number(uiForm.showSaleNum),
      showDeliveryFee: Number(uiForm.showDeliveryFee),
      enablePay: Number(uiForm.enablePay),
      enableRecharge: Number(uiForm.enablePay) === 1 ? Number(uiForm.enableRecharge) : 0,
      orderBtnText,
      homeTabText,
      listBtnText,
    });
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      uiDialogVisible.value = false;
      await getList();
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    uiSaving.value = false;
  }
};

const confirmDialog = async () => {
  if (!form.storeId) {
    ElMessage.error(
      $t('global.pleaseSelect') + $t('global.wxConfig.storeName'),
    );
    return;
  }
  saving.value = true;
  try {
    const res = await saveStoreWxConfigApi({
      storeId: form.storeId,
      enabled: Number(form.enabled),
      appId: form.appId.trim(),
      appSecret: form.appSecret,
      mchId: form.mchId.trim(),
      apiV3Key: form.apiV3Key,
      merchantSerialNumber: form.merchantSerialNumber.trim(),
      privateKey: form.privateKey,
      publicKey: form.publicKey,
      publicKeyId: form.publicKeyId.trim(),
      notifyUrl: form.notifyUrl.trim(),
      refundNotifyUrl: form.refundNotifyUrl.trim(),
    });
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      dialogVisible.value = false;
      await getList();
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-alert v-if="!isAdmin" type="warning" :closable="false" show-icon class="mb-3"
      :title="$t('global.wxConfig.adminOnly')" />
    <el-alert type="info" :closable="false" show-icon class="mb-3" :title="$t('global.wxConfig.tip')" />
    <el-card class="filter-card">
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
    </el-card>
    <el-card class="table-box mgt5">
      <Table :table-config="tableConfig" :list="list" :total="list.length" :pagination="false"
        @handle-click="handleClick" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="$t('global.wxConfig.dialogTitle')" width="720px" append-to-body
      :close-on-click-modal="false">
      <el-form label-width="140px">
        <el-form-item :label="$t('global.wxConfig.storeName')">
          <span>{{ form.storeName }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.enabled')">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.appId')">
          <div class="field-with-tip">
            <el-input v-model="form.appId" maxlength="64" />
            <el-tooltip :content="$t('global.wxConfig.helpAppId')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.appSecret')">
          <div class="field-with-tip">
            <el-input v-model="form.appSecret" type="password" show-password :placeholder="form.hasAppSecret
                ? $t('global.wxConfig.keepSecret')
                : $t('global.wxConfig.inputSecret')
              " />
            <el-tooltip :content="$t('global.wxConfig.helpAppSecret')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.mchId')">
          <div class="field-with-tip">
            <el-input v-model="form.mchId" maxlength="32" />
            <el-tooltip :content="$t('global.wxConfig.helpMchId')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.apiV3Key')">
          <div class="field-with-tip">
            <el-input v-model="form.apiV3Key" type="password" show-password :placeholder="form.hasApiV3Key
                ? $t('global.wxConfig.keepSecret')
                : $t('global.wxConfig.inputSecret')
              " />
            <el-tooltip :content="$t('global.wxConfig.helpApiV3Key')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.merchantSerialNumber')">
          <div class="field-with-tip">
            <el-input v-model="form.merchantSerialNumber" maxlength="128" />
            <el-tooltip :content="$t('global.wxConfig.helpMerchantSerialNumber')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.publicKeyId')">
          <div class="field-with-tip">
            <el-input v-model="form.publicKeyId" maxlength="128" />
            <el-tooltip :content="$t('global.wxConfig.helpPublicKeyId')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.privateKey')">
          <div class="field-with-tip field-with-tip--top">
            <el-input v-model="form.privateKey" type="textarea" :rows="4" :placeholder="form.hasPrivateKey
                ? $t('global.wxConfig.keepSecret')
                : $t('global.wxConfig.pemPlaceholder')
              " />
            <el-tooltip :content="$t('global.wxConfig.helpPrivateKey')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.publicKey')">
          <div class="field-with-tip field-with-tip--top">
            <el-input v-model="form.publicKey" type="textarea" :rows="4" :placeholder="form.hasPublicKey
                ? $t('global.wxConfig.keepSecret')
                : $t('global.wxConfig.pemPlaceholder')
              " />
            <el-tooltip :content="$t('global.wxConfig.helpPublicKey')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <!-- 支付/退款回调由系统按平台地址+店铺ID生成，先不在页面暴露 -->
        <!--
        <el-form-item :label="$t('global.wxConfig.notifyUrl')">
          <div class="field-with-tip">
            <el-input
              v-model="form.notifyUrl"
              :placeholder="$t('global.wxConfig.notifyPlaceholder')"
            />
            <el-tooltip
              :content="$t('global.wxConfig.helpNotifyUrl')"
              placement="top"
            >
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.refundNotifyUrl')">
          <div class="field-with-tip">
            <el-input
              v-model="form.refundNotifyUrl"
              :placeholder="$t('global.wxConfig.notifyPlaceholder')"
            />
            <el-tooltip
              :content="$t('global.wxConfig.helpRefundNotifyUrl')"
              placement="top"
            >
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        -->
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{
          $t('global.btn.cancel')
          }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmDialog">
          {{ $t('global.btn.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uiDialogVisible" :title="$t('global.wxConfig.uiDialogTitle')" width="620px" append-to-body
      :close-on-click-modal="false">
      <el-form label-width="160px">
        <el-form-item :label="$t('global.wxConfig.storeName')">
          <div class="field-with-tip">
            <span>{{ uiForm.storeName }}</span>
            <el-tooltip :content="$t('global.wxConfig.helpStoreName')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.miniappType')" required>
          <div class="field-with-tip">
            <el-radio-group v-model="uiForm.miniappType" @change="onMiniappTypeChange">
              <el-radio :value="1">{{ $t('global.wxConfig.mallType') }}</el-radio>
              <el-radio :value="2">{{ $t('global.wxConfig.bookingType') }}</el-radio>
            </el-radio-group>
            <el-tooltip :content="$t('global.wxConfig.helpMiniappType')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.showStock')">
          <div class="field-with-tip">
            <el-switch v-model="uiForm.showStock" :active-value="1" :inactive-value="0" />
            <el-tooltip :content="$t('global.wxConfig.helpShowStock')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.showAddress')">
          <div class="field-with-tip">
            <el-switch v-model="uiForm.showAddress" :active-value="1" :inactive-value="0" />
            <el-tooltip :content="$t('global.wxConfig.helpShowAddress')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.showDeliveryFee')">
          <div class="field-with-tip">
            <el-switch v-model="uiForm.showDeliveryFee" :active-value="1" :inactive-value="0" />
            <el-tooltip :content="$t('global.wxConfig.helpShowDeliveryFee')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.showQuantity')">
          <div class="field-with-tip">
            <el-switch v-model="uiForm.showQuantity" :active-value="1" :inactive-value="0" />
            <el-tooltip :content="$t('global.wxConfig.helpShowQuantity')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.showCart')">
          <div class="field-with-tip">
            <el-switch v-model="uiForm.showCart" :active-value="1" :inactive-value="0" />
            <el-tooltip :content="$t('global.wxConfig.helpShowCart')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.showSaleNum')">
          <div class="field-with-tip">
            <el-switch v-model="uiForm.showSaleNum" :active-value="1" :inactive-value="0" />
            <el-tooltip :content="$t('global.wxConfig.helpShowSaleNum')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.enablePay')">
          <div class="field-with-tip">
            <el-switch
              v-model="uiForm.enablePay"
              :active-value="1"
              :inactive-value="0"
              @change="onEnablePayChange"
            />
            <el-tooltip
              :content="$t('global.wxConfig.helpEnablePay')"
              placement="top"
              popper-class="wx-config-ui-help"
            >
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.enableRecharge')">
          <div class="field-with-tip">
            <el-switch
              v-model="uiForm.enableRecharge"
              :active-value="1"
              :inactive-value="0"
              :disabled="Number(uiForm.enablePay) !== 1"
              @change="onEnableRechargeChange"
            />
            <el-tooltip
              :content="$t('global.wxConfig.helpEnableRecharge')"
              placement="top"
              popper-class="wx-config-ui-help"
            >
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.orderBtnText')" required>
          <div class="field-with-tip">
            <el-input v-model="uiForm.orderBtnText" maxlength="16"
              :placeholder="$t('global.wxConfig.orderBtnPlaceholder')" />
            <el-tooltip :content="$t('global.wxConfig.helpOrderBtnText')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.homeTabText')" required>
          <div class="field-with-tip">
            <el-input v-model="uiForm.homeTabText" maxlength="4"
              :placeholder="$t('global.wxConfig.homeTabPlaceholder')" />
            <el-tooltip :content="$t('global.wxConfig.helpHomeTabText')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.wxConfig.listBtnText')" required>
          <div class="field-with-tip">
            <el-input v-model="uiForm.listBtnText" maxlength="6"
              :placeholder="$t('global.wxConfig.listBtnPlaceholder')" />
            <el-tooltip :content="$t('global.wxConfig.helpListBtnText')" placement="top" popper-class="wx-config-ui-help">
              <el-icon class="field-tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uiDialogVisible = false">{{
          $t('global.btn.cancel')
          }}</el-button>
        <el-button type="primary" :loading="uiSaving" @click="confirmUiDialog">
          {{ $t('global.btn.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use '#/styles/style.scss' as *;

.filter-card {
  flex-shrink: 0;
}

.field-with-tip {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.field-with-tip--top {
  align-items: flex-start;
}

.field-with-tip .el-input,
.field-with-tip .el-textarea {
  flex: 1;
}

.field-tip-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
}
.field-tip-icon:hover {
  color: var(--el-color-primary);
}
</style>

<style lang="scss">
.wx-config-ui-help {
  max-width: 360px;
  line-height: 1.5;
}
</style>
