<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addMallCouponApi,
  deleteMallCouponApi,
  editMallCouponApi,
  getCustomerListApi,
  getMallCouponListApi,
  getStoreListApi,
  grantMallCouponApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const isLoading = ref(false);
const total = ref(0);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({});
const storeDict = reactive<Array<{ label: string; value: any }>>([]);
const list = reactive<any[]>([]);

function statusLabel(row: any) {
  if (row?.effective) {
    return $t('global.coupon.enabled');
  }
  if (Number(row?.status) === 1) {
    return $t('global.coupon.expired');
  }
  return $t('global.coupon.disabled');
}

const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.coupon.storeName'),
    },
    {
      prop: 'name',
      label: $t('global.coupon.name'),
    },
    {
      prop: 'thresholdText',
      label: $t('global.coupon.threshold'),
      width: '120px',
    },
    {
      prop: 'discountAmount',
      label: $t('global.coupon.discount'),
      width: '110px',
    },
    {
      prop: 'stockText',
      label: $t('global.coupon.totalCount'),
      width: '120px',
    },
    {
      prop: 'issueTypeLabel',
      label: $t('global.coupon.issueType'),
      width: '110px',
    },
    {
      prop: 'expireText',
      label: $t('global.coupon.expire'),
      width: '170px',
    },
    {
      prop: 'statusLabel',
      label: $t('global.coupon.status'),
      width: '100px',
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '170px',
      filter: (value: any) => {
        return value ? String(value).slice(0, 19) : '';
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '300px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
        },
        {
          type: 'warning',
          label: $t('global.btn.grant'),
          isShow: (item: any) => Number(item.issueType) === 2,
        },
        {
          type: 'warning',
          label: $t('global.btn.disable'),
          isShow: (item: any) => Number(item.status) === 1,
        },
        {
          type: 'success',
          label: $t('global.btn.enable'),
          isShow: (item: any) => Number(item.status) !== 1,
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

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'name',
      label: $t('global.coupon.name'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.coupon.name')}`,
    },
    {
      type: 'select',
      prop: 'status',
      label: $t('global.coupon.status'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.coupon.status')}`,
      options: [
        { label: $t('global.coupon.enabled'), value: '1', keepValue: true },
        { label: $t('global.coupon.disabled'), value: '0', keepValue: true },
      ],
    },
    {
      type: 'select',
      prop: 'issueType',
      label: $t('global.coupon.issueType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.coupon.issueType')}`,
      options: [
        { label: $t('global.coupon.issueClaim'), value: '1', keepValue: true },
        { label: $t('global.coupon.issueGrant'), value: '2', keepValue: true },
      ],
    },
  ] as Array<Record<string, any>>,
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const saving = ref(false);
const editingId = ref('');
const form = reactive({
  storeId: '' as string,
  name: '',
  thresholdAmount: 0 as number,
  discountAmount: undefined as number | undefined,
  totalCount: undefined as number | undefined,
  perUserLimit: 1,
  issueType: 1,
  userIds: [] as string[],
  forever: 1,
  endTime: '' as string,
  status: 1,
});

const grantVisible = ref(false);
const granting = ref(false);
const grantTemplateId = ref('');
const grantUserIds = ref<string[]>([]);
const customerOptions = reactive<Array<{ label: string; value: string }>>([]);

function showErrorMessage(message: string) {
  ElMessage({
    type: 'error',
    message,
    duration: 5000,
    showClose: true,
    grouping: true,
  });
}

const search = (data: any) => {
  searchParams.value = { ...data };
  pageInfo.pageNum = 1;
  getList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getList();
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  pageInfo.pageNum = 1;
  getList();
};

const handleClick = (row: any, label: string) => {
  switch (label) {
    case $t('global.btn.edit'): {
      openEdit(row);
      break;
    }
    case $t('global.btn.enable'): {
      toggleStatus(row, 1);
      break;
    }
    case $t('global.btn.disable'): {
      toggleStatus(row, 0);
      break;
    }
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
    case $t('global.btn.grant'): {
      openGrant(row);
      break;
    }
    // No default
  }
};

function resetForm() {
  form.storeId = '';
  form.name = '';
  form.thresholdAmount = 0;
  form.discountAmount = undefined;
  form.totalCount = undefined;
  form.perUserLimit = 1;
  form.issueType = 1;
  form.userIds = [];
  form.forever = 1;
  form.endTime = '';
  form.status = 1;
}

const handleAdd = () => {
  editingId.value = '';
  dialogTitle.value = $t('global.btn.add');
  resetForm();
  dialogVisible.value = true;
  loadCustomers(form.storeId);
};

const openEdit = (row: any) => {
  editingId.value = String(row.id);
  dialogTitle.value = $t('global.btn.edit');
  form.storeId = row.storeId == null ? '' : String(row.storeId);
  form.name = row.name || '';
  form.thresholdAmount = Number(row.thresholdAmount || 0);
  form.discountAmount = Number(row.discountAmount);
  form.totalCount = row.totalCount == null ? undefined : Number(row.totalCount);
  form.perUserLimit = Number(row.perUserLimit || 1);
  form.issueType = Number(row.issueType) === 2 ? 2 : 1;
  form.userIds = [];
  form.forever = Number(row.forever) === 0 ? 0 : 1;
  form.endTime = row.endTime ? String(row.endTime).slice(0, 19) : '';
  form.status = Number(row.status) === 0 ? 0 : 1;
  dialogVisible.value = true;
  loadCustomers(form.storeId);
};

function buildPayload() {
  const payload: Record<string, any> = {
    name: form.name.trim(),
    thresholdAmount: form.thresholdAmount ?? 0,
    discountAmount: form.discountAmount,
    totalCount: form.totalCount == null || form.totalCount <= 0 ? null : form.totalCount,
    perUserLimit: form.perUserLimit,
    issueType: Number(form.issueType),
    forever: Number(form.forever),
    status: Number(form.status),
    endTime: Number(form.forever) === 1 ? null : form.endTime,
  };
  if (isAdmin.value) {
    payload.storeId = String(form.storeId);
  }
  if (editingId.value) {
    payload.id = editingId.value;
  } else if (Number(form.issueType) === 2 && form.userIds.length) {
    payload.userIds = form.userIds;
  }
  return payload;
}

const confirmDialog = async () => {
  if (!form.name.trim()) {
    showErrorMessage($t('global.pleaseEnter') + $t('global.coupon.name'));
    return;
  }
  if (isAdmin.value && !editingId.value && !form.storeId) {
    showErrorMessage($t('global.pleaseSelect') + $t('global.coupon.storeName'));
    return;
  }
  if (form.discountAmount == null || Number(form.discountAmount) <= 0) {
    showErrorMessage($t('global.pleaseEnter') + $t('global.coupon.discount'));
    return;
  }
  if (Number(form.forever) === 0 && !form.endTime) {
    showErrorMessage($t('global.pleaseSelect') + $t('global.coupon.endTime'));
    return;
  }
  saving.value = true;
  try {
    const api = editingId.value ? editMallCouponApi : addMallCouponApi;
    const res = await api(buildPayload());
    if (res.code === 200) {
      const extraMsg = res.data?.message;
      ElMessage.success(extraMsg || $t('global.message.success'));
      dialogVisible.value = false;
      getList();
    } else {
      showErrorMessage(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.msg;
    if (msg) {
      showErrorMessage(msg);
    }
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async (row: any, status: number) => {
  try {
    const res = await editMallCouponApi({
      id: String(row.id),
      status,
    });
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      getList();
    } else {
      showErrorMessage(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.msg;
    if (msg) {
      showErrorMessage(msg);
    }
  }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
    type: 'warning',
  }).then(async () => {
    const res = await deleteMallCouponApi([row.id]);
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      getList();
    } else {
      showErrorMessage(res.msg || $t('global.message.error'));
    }
  });
};

const getList = async () => {
  const obj = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  if (!isAdmin.value) {
    delete obj.storeId;
  }
  try {
    isLoading.value = true;
    const res = await getMallCouponListApi(obj);
    if (res.code === 200) {
      list.length = 0;
      list.push(
        ...(res.data.list || []).map((item: any) => ({
          ...item,
          statusLabel: statusLabel(item),
          thresholdText:
            Number(item.thresholdAmount) > 0
              ? item.thresholdAmount
              : $t('global.coupon.noThreshold'),
          stockText: `${item.issuedCount || 0} / ${
            item.totalCount == null ? $t('global.coupon.unlimited') : item.totalCount
          }`,
          issueTypeLabel:
            Number(item.issueType) === 2
              ? $t('global.coupon.issueGrant')
              : $t('global.coupon.issueClaim'),
        })),
      );
      total.value = res.data.total || 0;
    } else {
      ElMessage.error($t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const getStoreList = async () => {
  const res = await getStoreListApi({ pageSize: 9999, pageNum: 1 });
  if (res.code === 200) {
    storeDict.splice(
      0,
      storeDict.length,
      ...(res.data.list || []).map((item: any) => ({
        label: item.storeName,
        value: String(item.storeId),
        keepValue: true,
      })),
    );
  }
};

function customerLabel(item: any) {
  const name = item.realName || item.userName || '用户';
  const phone = item.phone || '';
  return phone ? `${name}（${phone}）` : name;
}

const loadCustomers = async (storeId?: string) => {
  customerOptions.splice(0, customerOptions.length);
  if (isAdmin.value && !storeId) {
    return;
  }
  try {
    const params: Record<string, any> = { pageNum: 1, pageSize: 999 };
    if (isAdmin.value && storeId) {
      params.bindStoreId = storeId;
    }
    const res = await getCustomerListApi(params);
    if (res.code === 200) {
      customerOptions.push(
        ...(res.data.list || []).map((item: any) => ({
          label: customerLabel(item),
          value: String(item.id),
        })),
      );
    }
  } catch (error) {
    console.log(error);
  }
};

const openGrant = async (row: any) => {
  grantTemplateId.value = String(row.id);
  grantUserIds.value = [];
  grantVisible.value = true;
  await loadCustomers(row.storeId == null ? '' : String(row.storeId));
};

const confirmGrant = async () => {
  if (!grantUserIds.value.length) {
    showErrorMessage($t('global.pleaseSelect') + $t('global.coupon.selectUsers'));
    return;
  }
  granting.value = true;
  try {
    const res = await grantMallCouponApi({
      templateId: grantTemplateId.value,
      userIds: grantUserIds.value,
    });
    if (res.code === 200) {
      ElMessage.success(res.data?.message || $t('global.message.success'));
      grantVisible.value = false;
      getList();
    } else {
      showErrorMessage(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.msg;
    if (msg) {
      showErrorMessage(msg);
    }
  } finally {
    granting.value = false;
  }
};

watch(
  () => [form.storeId, form.issueType, dialogVisible.value],
  ([storeId, issueType, visible]) => {
    if (visible && Number(issueType) === 2) {
      loadCustomers(String(storeId || ''));
    }
  },
);

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.push({
      type: 'select',
      prop: 'storeId',
      label: $t('global.coupon.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.coupon.storeName')}`,
      options: storeDict,
    });
    await getStoreList();
  }
  getList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <Filter :form-config="formConfig" @search="search" @reset="reset">
        <template #extra>
          <div class="button-group">
            <el-button type="success" :icon="Plus" @click="handleAdd">
              {{ $t('global.btn.add') }}
            </el-button>
          </div>
        </template>
      </Filter>
    </el-card>
    <el-card class="table-box mgt5">
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="total"
        @handle-click="handleClick"
        @handle-current-change="handleCurrentChange"
        @handle-size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="110px">
        <el-form-item v-if="isAdmin && !editingId" :label="$t('global.coupon.storeName')" required>
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option
              v-for="item in storeDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.coupon.name')" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item :label="$t('global.coupon.threshold')">
          <el-input-number
            v-model="form.thresholdAmount"
            :min="0"
            :precision="2"
            :step="1"
            controls-position="right"
          />
          <span class="unit">{{ $t('global.coupon.yuan') }}（0 {{ $t('global.coupon.noThreshold') }}）</span>
        </el-form-item>
        <el-form-item :label="$t('global.coupon.discount')" required>
          <el-input-number
            v-model="form.discountAmount"
            :min="0.01"
            :precision="2"
            :step="1"
            controls-position="right"
          />
          <span class="unit">{{ $t('global.coupon.yuan') }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.coupon.totalCount')">
          <el-input-number
            v-model="form.totalCount"
            :min="1"
            :precision="0"
            :step="1"
            controls-position="right"
          />
          <span class="unit">{{ $t('global.coupon.unlimited') }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.coupon.perUserLimit')">
          <el-input-number
            v-model="form.perUserLimit"
            :min="1"
            :precision="0"
            :step="1"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item :label="$t('global.coupon.issueType')" required>
          <el-radio-group v-model="form.issueType">
            <el-radio :value="1">{{ $t('global.coupon.issueClaim') }}</el-radio>
            <el-radio :value="2">{{ $t('global.coupon.issueGrant') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="form.issueType === 2 && !editingId"
          :label="$t('global.coupon.selectUsers')"
        >
          <el-select
            v-model="form.userIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
            :placeholder="$t('global.coupon.selectUsersPlaceholder')"
          >
            <el-option
              v-for="item in customerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.coupon.expire')" required>
          <el-radio-group v-model="form.forever">
            <el-radio :value="1">{{ $t('global.coupon.forever') }}</el-radio>
            <el-radio :value="0">{{ $t('global.coupon.until') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.forever === 0" :label="$t('global.coupon.endTime')" required>
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('global.coupon.status')">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">{{ $t('global.btn.enable') }}</el-radio>
            <el-radio :value="0">{{ $t('global.btn.disable') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('global.btn.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmDialog">
          {{ $t('global.btn.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="grantVisible"
      :title="$t('global.coupon.grantTitle')"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="110px">
        <el-form-item :label="$t('global.coupon.selectUsers')" required>
          <el-select
            v-model="grantUserIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
            :placeholder="$t('global.coupon.selectUsersPlaceholder')"
          >
            <el-option
              v-for="item in customerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">{{ $t('global.btn.cancel') }}</el-button>
        <el-button type="primary" :loading="granting" @click="confirmGrant">
          {{ $t('global.btn.grant') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.button-group {
  display: inline-flex;
  margin-left: 10px;
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
