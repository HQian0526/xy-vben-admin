<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addMallPromoApi,
  deleteMallPromoApi,
  editMallPromoApi,
  getMallPromoListApi,
  getStoreListApi,
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
    return $t('global.promo.enabled');
  }
  if (Number(row?.status) === 1) {
    return $t('global.promo.expired');
  }
  return $t('global.promo.disabled');
}

const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.promo.storeName'),
    },
    {
      prop: 'name',
      label: $t('global.promo.name'),
    },
    {
      prop: 'tierText',
      label: $t('global.promo.tiers'),
      minWidth: '180px',
    },
    {
      prop: 'expireText',
      label: $t('global.promo.expire'),
      width: '170px',
    },
    {
      prop: 'statusLabel',
      label: $t('global.promo.status'),
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
      width: '240px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
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
      label: $t('global.promo.name'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.promo.name')}`,
    },
    {
      type: 'select',
      prop: 'status',
      label: $t('global.promo.status'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.promo.status')}`,
      options: [
        { label: $t('global.promo.enabled'), value: '1', keepValue: true },
        { label: $t('global.promo.disabled'), value: '0', keepValue: true },
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
  forever: 1,
  endTime: '' as string,
  status: 1,
  tiers: [{ thresholdAmount: undefined as number | undefined, discountAmount: undefined as number | undefined }],
});

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
    // No default
  }
};

function resetForm() {
  form.storeId = '';
  form.name = '';
  form.forever = 1;
  form.endTime = '';
  form.status = 1;
  form.tiers = [{ thresholdAmount: undefined, discountAmount: undefined }];
}

const handleAdd = () => {
  editingId.value = '';
  dialogTitle.value = $t('global.btn.add');
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  editingId.value = String(row.id);
  dialogTitle.value = $t('global.btn.edit');
  form.storeId = row.storeId == null ? '' : String(row.storeId);
  form.name = row.name || '';
  form.forever = Number(row.forever) === 0 ? 0 : 1;
  form.endTime = row.endTime ? String(row.endTime).slice(0, 19) : '';
  form.status = Number(row.status) === 0 ? 0 : 1;
  const tiers = Array.isArray(row.tiers) && row.tiers.length
    ? row.tiers.map((item: any) => ({
        thresholdAmount: Number(item.thresholdAmount),
        discountAmount: Number(item.discountAmount),
      }))
    : [{ thresholdAmount: undefined, discountAmount: undefined }];
  form.tiers = tiers;
  dialogVisible.value = true;
};

const addTier = () => {
  form.tiers.push({ thresholdAmount: undefined, discountAmount: undefined });
};

const removeTier = (index: number) => {
  if (form.tiers.length <= 1) {
    return;
  }
  form.tiers.splice(index, 1);
};

function buildPayload() {
  const payload: Record<string, any> = {
    name: form.name.trim(),
    forever: Number(form.forever),
    status: Number(form.status),
    endTime: Number(form.forever) === 1 ? null : form.endTime,
    tiers: form.tiers.map((item) => ({
      thresholdAmount: item.thresholdAmount,
      discountAmount: item.discountAmount,
    })),
  };
  if (isAdmin.value) {
    payload.storeId = String(form.storeId);
  }
  if (editingId.value) {
    payload.id = editingId.value;
  }
  return payload;
}

const confirmDialog = async () => {
  if (!form.name.trim()) {
    showErrorMessage($t('global.pleaseEnter') + $t('global.promo.name'));
    return;
  }
  if (isAdmin.value && !editingId.value && !form.storeId) {
    showErrorMessage($t('global.pleaseSelect') + $t('global.promo.storeName'));
    return;
  }
  if (Number(form.forever) === 0 && !form.endTime) {
    showErrorMessage($t('global.pleaseSelect') + $t('global.promo.endTime'));
    return;
  }
  for (const tier of form.tiers) {
    if (tier.thresholdAmount == null || tier.discountAmount == null) {
      showErrorMessage($t('global.message.editTableItemIsNull'));
      return;
    }
  }
  saving.value = true;
  try {
    const api = editingId.value ? editMallPromoApi : addMallPromoApi;
    const res = await api(buildPayload());
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
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
    const res = await editMallPromoApi({
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
    const res = await deleteMallPromoApi([row.id]);
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
    const res = await getMallPromoListApi(obj);
    if (res.code === 200) {
      list.length = 0;
      list.push(
        ...(res.data.list || []).map((item: any) => ({
          ...item,
          statusLabel: statusLabel(item),
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

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.push({
      type: 'select',
      prop: 'storeId',
      label: $t('global.promo.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.promo.storeName')}`,
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
      width="640px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="110px">
        <el-form-item v-if="isAdmin && !editingId" :label="$t('global.promo.storeName')" required>
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option
              v-for="item in storeDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.promo.name')" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item :label="$t('global.promo.expire')" required>
          <el-radio-group v-model="form.forever">
            <el-radio :value="1">{{ $t('global.promo.forever') }}</el-radio>
            <el-radio :value="0">{{ $t('global.promo.until') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.forever === 0" :label="$t('global.promo.endTime')" required>
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('global.promo.status')">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">{{ $t('global.btn.enable') }}</el-radio>
            <el-radio :value="0">{{ $t('global.btn.disable') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('global.promo.tiers')" required>
          <div class="tier-list">
            <div v-for="(tier, index) in form.tiers" :key="index" class="tier-row">
              <span>{{ $t('global.promo.threshold') }}</span>
              <el-input-number
                v-model="tier.thresholdAmount"
                :min="0.01"
                :precision="2"
                :step="1"
                controls-position="right"
              />
              <span>{{ $t('global.promo.yuan') }}</span>
              <span>{{ $t('global.promo.discount') }}</span>
              <el-input-number
                v-model="tier.discountAmount"
                :min="0.01"
                :precision="2"
                :step="1"
                controls-position="right"
              />
              <span>{{ $t('global.promo.yuan') }}</span>
              <el-button
                type="danger"
                link
                :disabled="form.tiers.length <= 1"
                @click="removeTier(index)"
              >
                {{ $t('global.btn.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addTier">
              {{ $t('global.promo.addTier') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('global.btn.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmDialog">
          {{ $t('global.btn.confirm') }}
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

.tier-list {
  width: 100%;
}

.tier-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
</style>
