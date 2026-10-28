<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  assistStoreMemberRechargeApi,
  getStoreListApi,
  lookupStoreMemberApi,
  verifyStoreMemberDebitApi,
} from '#/api';
import { $t } from '#/locales';

const PHONE_REG = /^1[3-9]\d{9}$/;

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const storeDict = reactive<Array<{ label: string; value: string }>>([]);
const querying = ref(false);
const debiting = ref(false);
const recharging = ref(false);
const activeTab = ref('debit');
const customer = ref<Record<string, any> | null>(null);
const lookupTimer = ref<null | ReturnType<typeof setTimeout>>(null);

const form = reactive({
  storeId: '',
  phone: '',
});
const debitForm = reactive({
  amount: undefined as number | undefined,
  remark: '',
});
const rechargeForm = reactive({
  amount: undefined as number | undefined,
  remark: '',
});

const phoneReady = computed(() => PHONE_REG.test(form.phone));
const canLookup = computed(
  () => phoneReady.value && (!isAdmin.value || !!form.storeId),
);
const canDebit = computed(
  () =>
    !!customer.value &&
    Number(debitForm.amount) > 0 &&
    Number(customer.value.balance || 0) >= Number(debitForm.amount),
);
const canRecharge = computed(
  () => !!customer.value && Number(rechargeForm.amount) >= 0.01,
);

function formatMoney(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function resolveStoreId() {
  return isAdmin.value ? form.storeId : '';
}

function resetActionForms() {
  debitForm.amount = undefined;
  debitForm.remark = '';
  rechargeForm.amount = undefined;
  rechargeForm.remark = '';
}

function applyCustomer(data: any, phone: string) {
  customer.value = {
    userId: data?.userId != null ? String(data.userId) : '',
    storeId: data?.storeId != null ? String(data.storeId) : '',
    phone: data?.phone || phone,
    nickname: data?.nickname || $t('global.memberVerify.defaultNickname'),
    member: !!data?.member,
    balance: Number(data?.balance || 0),
  };
}

const loadStores = async () => {
  if (!isAdmin.value) {
    return;
  }
  const res = await getStoreListApi({ pageNum: 1, pageSize: 9999 });
  if (res.code === 200) {
    storeDict.splice(
      0,
      storeDict.length,
      ...(res.data?.list || []).map((item: any) => ({
        label: item.storeName,
        value: String(item.storeId),
      })),
    );
  }
};

const handleLookup = async () => {
  if (!canLookup.value || querying.value) {
    if (isAdmin.value && !form.storeId) {
      ElMessage.warning(
        $t('global.pleaseSelect') + $t('global.memberVerify.storeName'),
      );
    } else if (!phoneReady.value) {
      ElMessage.warning($t('global.memberVerify.phoneInvalid'));
    }
    return;
  }
  const phone = form.phone;
  querying.value = true;
  try {
    const params: Record<string, string> = { phone };
    const storeId = resolveStoreId();
    if (storeId) {
      params.storeId = storeId;
    }
    const res = await lookupStoreMemberApi(params);
    if (form.phone !== phone) {
      return;
    }
    if (res.code === 200) {
      applyCustomer(res.data, phone);
      resetActionForms();
    } else {
      customer.value = null;
      ElMessage.error(res.msg || $t('global.message.searchError'));
    }
  } catch {
    if (form.phone === phone) {
      customer.value = null;
    }
  } finally {
    querying.value = false;
  }
};

function scheduleLookup() {
  if (lookupTimer.value) {
    clearTimeout(lookupTimer.value);
    lookupTimer.value = null;
  }
  if (!PHONE_REG.test(form.phone)) {
    return;
  }
  lookupTimer.value = setTimeout(() => {
    handleLookup();
  }, 300);
}

watch(
  () => form.phone,
  (value) => {
    const next = String(value || '')
      .replaceAll(/\D/g, '')
      .slice(0, 11);
    if (next !== form.phone) {
      form.phone = next;
      return;
    }
    if (!customer.value || customer.value.phone !== next) {
      customer.value = null;
    }
    scheduleLookup();
  },
);

watch(
  () => form.storeId,
  () => {
    customer.value = null;
    if (phoneReady.value) {
      scheduleLookup();
    }
  },
);

function buildPayload(extra: Record<string, any>) {
  const payload: Record<string, any> = { ...extra };
  const storeId = resolveStoreId();
  if (storeId) {
    payload.storeId = storeId;
  }
  return payload;
}

const handleDebit = async () => {
  if (!customer.value || debiting.value) {
    return;
  }
  const amount = Number(Number(debitForm.amount).toFixed(2));
  if (!(amount > 0)) {
    ElMessage.warning($t('global.memberVerify.amountInvalid'));
    return;
  }
  if (amount > Number(customer.value.balance || 0)) {
    ElMessage.warning($t('global.memberVerify.balanceNotEnough'));
    return;
  }
  try {
    await ElMessageBox.confirm(
      $t('global.memberVerify.confirmDebit', {
        name: customer.value.nickname,
        amount: amount.toFixed(2),
      }),
      $t('global.memberVerify.debitTitle'),
      {
        confirmButtonText: $t('global.memberVerify.debitConfirm'),
        cancelButtonText: $t('global.btn.cancel'),
        type: 'warning',
      },
    );
  } catch {
    return;
  }
  debiting.value = true;
  try {
    const remark = debitForm.remark.trim();
    const res = await verifyStoreMemberDebitApi(
      buildPayload({
        phone: form.phone,
        amount,
        remark: remark || undefined,
      }),
    );
    if (res.code === 200) {
      applyCustomer(res.data, form.phone);
      debitForm.amount = undefined;
      debitForm.remark = '';
      ElMessage.success($t('global.memberVerify.debitSuccess'));
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch {
    // interceptor already toasts business errors
  } finally {
    debiting.value = false;
  }
};

const handleRecharge = async () => {
  if (!customer.value || recharging.value) {
    return;
  }
  const amount = Number(Number(rechargeForm.amount).toFixed(2));
  if (!(amount >= 0.01)) {
    ElMessage.warning($t('global.memberVerify.amountInvalid'));
    return;
  }
  try {
    await ElMessageBox.confirm(
      $t('global.memberVerify.confirmRecharge', {
        name: customer.value.nickname,
        amount: amount.toFixed(2),
      }),
      $t('global.memberVerify.rechargeTitle'),
      {
        confirmButtonText: $t('global.memberVerify.rechargeConfirm'),
        cancelButtonText: $t('global.btn.cancel'),
        type: 'warning',
      },
    );
  } catch {
    return;
  }
  recharging.value = true;
  try {
    const remark = rechargeForm.remark.trim();
    const res = await assistStoreMemberRechargeApi(
      buildPayload({
        userId: customer.value.userId,
        phone: form.phone,
        amount,
        remark: remark || undefined,
      }),
    );
    if (res.code === 200) {
      applyCustomer(res.data, form.phone);
      rechargeForm.amount = undefined;
      rechargeForm.remark = '';
      ElMessage.success($t('global.memberVerify.rechargeSuccess'));
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch {
    // interceptor already toasts business errors
  } finally {
    recharging.value = false;
  }
};

onMounted(() => {
  loadStores();
});
</script>

<template>
  <div class="pd5 member-page">
    <el-card>
      <el-form label-width="96px" class="lookup-form" @submit.prevent>
        <el-form-item
          v-if="isAdmin"
          :label="$t('global.memberVerify.storeName')"
          required
        >
          <el-select
            v-model="form.storeId"
            filterable
            clearable
            class="w-full"
            :placeholder="
              $t('global.pleaseSelect') + $t('global.memberVerify.storeName')
            "
          >
            <el-option
              v-for="item in storeDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.memberVerify.phone')" required>
          <div class="phone-row">
            <el-input
              v-model="form.phone"
              maxlength="11"
              :placeholder="
                $t('global.pleaseEnter') + $t('global.memberVerify.phone')
              "
              @keyup.enter="handleLookup"
            />
            <el-button
              type="primary"
              :loading="querying"
              :disabled="!canLookup"
              @click="handleLookup"
            >
              {{ $t('global.memberVerify.lookup') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div v-if="customer" class="info-card">
        <div class="info-row">
          <span class="info-label">{{ $t('global.memberVerify.nickname') }}</span>
          <span class="info-value">{{ customer.nickname }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('global.memberVerify.phone') }}</span>
          <span class="info-value">{{ customer.phone }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('global.memberVerify.memberStatus') }}</span>
          <el-tag :type="customer.member ? 'warning' : 'info'" effect="dark" size="small">
            {{
              customer.member
                ? $t('global.memberVerify.memberUser')
                : $t('global.memberVerify.basicUser')
            }}
          </el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('global.memberVerify.balance') }}</span>
          <span class="balance">¥{{ formatMoney(customer.balance) }}</span>
        </div>
        <el-alert
          v-if="!customer.member"
          class="mgt10"
          type="warning"
          :closable="false"
          :title="$t('global.memberVerify.notMemberTip')"
        />
      </div>

      <el-tabs v-if="customer" v-model="activeTab" class="mgt20">
        <el-tab-pane :label="$t('global.memberVerify.debitTitle')" name="debit">
          <el-form label-width="96px" @submit.prevent>
            <el-form-item :label="$t('global.memberVerify.debitAmount')" required>
              <el-input-number
                v-model="debitForm.amount"
                :min="0.01"
                :precision="2"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
            <el-form-item :label="$t('global.memberVerify.remark')">
              <el-input
                v-model="debitForm.remark"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                :placeholder="$t('global.memberVerify.debitRemarkPlaceholder')"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="danger"
                :loading="debiting"
                :disabled="!canDebit"
                @click="handleDebit"
              >
                {{ $t('global.memberVerify.debitConfirm') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="$t('global.memberVerify.rechargeTitle')" name="recharge">
          <el-form label-width="96px" @submit.prevent>
            <el-form-item :label="$t('global.memberVerify.rechargeAmount')" required>
              <el-input-number
                v-model="rechargeForm.amount"
                :min="0.01"
                :precision="2"
                :step="1"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
            <el-form-item :label="$t('global.memberVerify.remark')">
              <el-input
                v-model="rechargeForm.remark"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                :placeholder="$t('global.memberVerify.rechargeRemarkPlaceholder')"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="recharging"
                :disabled="!canRecharge"
                @click="handleRecharge"
              >
                {{ $t('global.memberVerify.rechargeConfirm') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.member-page {
  max-width: 760px;

  :deep(.el-card__body) {
    padding: 24px !important;
  }
}

.lookup-form {
  max-width: 560px;
}

.phone-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.w-full {
  width: 100%;
}

.info-card {
  max-width: 560px;
  padding: 8px 4px 0;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-label {
  color: var(--el-text-color-secondary);
}

.info-value {
  font-weight: 600;
}

.balance {
  font-size: 22px;
  font-weight: 700;
  color: #00a896;
}
</style>
