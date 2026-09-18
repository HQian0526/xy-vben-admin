<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import {
  getStorePrinterApi,
  getStorePrinterListApi,
  queryStorePrinterStatusApi,
  saveStorePrinterApi,
  testStorePrinterApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(() => Number(userStore.userInfo?.identityType) === 3);

const isLoading = ref(false);
const saving = ref(false);
const statusLoading = ref(false);
const testLoading = ref(false);
const allRows = ref<any[]>([]);
const list = reactive<any[]>([]);
const searchParams = ref<Record<string, any>>({});
const storeDict = reactive<Array<{ label: string; value: any }>>([]);
const dialogVisible = ref(false);
const form = reactive({
  storeId: '',
  storeName: '',
  printerSn: '',
  printerKey: '',
  printerName: '',
  printEnabled: 1,
  voiceEnabled: 1,
  copies: 1,
  lastStatus: '',
  lastBindMsg: '',
  bound: false,
  platformReady: false,
  hasKey: false,
});

const platformReady = computed(() =>
  allRows.value.some((item) => item.platformReady),
);

const formConfig = reactive({
  list: [
    {
      type: 'select',
      prop: 'storeId',
      label: $t('global.printer.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.printer.storeName')}`,
      options: storeDict,
    },
  ] as Array<Record<string, any>>,
});

const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.printer.storeName'),
      minWidth: '140px',
    },
    {
      prop: 'printerSn',
      label: $t('global.printer.printerSn'),
      minWidth: '140px',
    },
    {
      prop: 'boundLabel',
      label: $t('global.printer.bound'),
      width: '100px',
    },
    {
      prop: 'printLabel',
      label: $t('global.printer.printEnabled'),
      width: '140px',
    },
    {
      prop: 'voiceLabel',
      label: $t('global.printer.voiceEnabled'),
      width: '110px',
    },
    {
      prop: 'lastStatus',
      label: $t('global.printer.lastStatus'),
      minWidth: '140px',
    },
    {
      prop: 'lastBindMsg',
      label: $t('global.printer.lastBindMsg'),
      minWidth: '180px',
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '120px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.setting'),
          isShow: () => true,
        },
      ],
    },
  ],
});

function mapRow(item: any) {
  return {
    ...item,
    boundLabel: item.bound
      ? $t('global.printer.boundYes')
      : $t('global.printer.boundNo'),
    printLabel:
      Number(item.printEnabled) === 1
        ? $t('global.printer.on')
        : $t('global.printer.off'),
    voiceLabel:
      Number(item.voiceEnabled) === 1
        ? $t('global.printer.on')
        : $t('global.printer.off'),
    lastStatus: item.lastStatus || '--',
    lastBindMsg: item.lastBindMsg || '--',
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
    const res = await getStorePrinterListApi();
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
  form.printerSn = detail.printerSn || '';
  form.printerKey = '';
  form.printerName = detail.printerName || '';
  form.printEnabled = Number(detail.printEnabled) === 0 ? 0 : 1;
  form.voiceEnabled = Number(detail.voiceEnabled) === 0 ? 0 : 1;
  form.copies = Number(detail.copies) > 0 ? Number(detail.copies) : 1;
  form.lastStatus = detail.lastStatus || '';
  form.lastBindMsg = detail.lastBindMsg || '';
  form.bound = !!detail.bound;
  form.platformReady = !!detail.platformReady;
  form.hasKey = !!detail.printerKey;
}

const openEdit = async (row: any) => {
  try {
    const res = await getStorePrinterApi(row.storeId);
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

const handleClick = (row: any, label: string) => {
  if (label === $t('global.btn.setting')) {
    openEdit(row);
  }
};

const confirmDialog = async () => {
  if (!form.storeId) {
    ElMessage.error(
      $t('global.pleaseSelect') + $t('global.printer.storeName'),
    );
    return;
  }
  saving.value = true;
  try {
    const res = await saveStorePrinterApi({
      storeId: form.storeId,
      printerSn: form.printerSn.trim(),
      printerKey: form.printerKey,
      printerName: form.printerName.trim(),
      printEnabled: Number(form.printEnabled),
      voiceEnabled: Number(form.voiceEnabled),
      copies: Number(form.copies) || 1,
    });
    if (res.code === 200) {
      ElMessage.success(res.data?.lastBindMsg || $t('global.message.success'));
      fillForm(res.data || form);
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

const handleQueryStatus = async () => {
  if (!form.storeId) {
    return;
  }
  statusLoading.value = true;
  try {
    const res = await queryStorePrinterStatusApi(form.storeId);
    if (res.code === 200) {
      form.lastStatus = String(res.data || '');
      ElMessage.success(form.lastStatus);
      await getList();
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    statusLoading.value = false;
  }
};

const handleTestPrint = async () => {
  if (!form.storeId) {
    return;
  }
  testLoading.value = true;
  try {
    const res = await testStorePrinterApi(form.storeId);
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    testLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-alert
      v-if="!isAdmin"
      type="warning"
      :closable="false"
      show-icon
      class="mb-3"
      :title="$t('global.printer.adminOnly')"
    />
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="mb-3"
      :title="$t('global.printer.tip')"
    />
    <el-alert
      v-if="isAdmin && allRows.length > 0 && !platformReady"
      type="warning"
      :closable="false"
      show-icon
      class="mb-3"
      :title="$t('global.printer.ukeyMissing')"
    />
    <el-card class="filter-card">
      <Filter :form-config="formConfig" @search="search" @reset="reset" />
    </el-card>
    <el-card class="table-box mgt5">
      <Table
        :table-config="tableConfig"
        :list="list"
        :total="list.length"
        :pagination="false"
        @handle-click="handleClick"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="$t('global.printer.dialogTitle')"
      width="640px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="150px">
        <el-form-item :label="$t('global.printer.storeName')">
          <span>{{ form.storeName }}</span>
        </el-form-item>
        <el-form-item :label="$t('global.printer.printerSn')">
          <div class="field-with-tip">
            <el-input v-model="form.printerSn" maxlength="64" />
            <el-tooltip :content="$t('global.printer.helpSn')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.printer.printerKey')">
          <div class="field-with-tip">
            <el-input
              v-model="form.printerKey"
              maxlength="64"
              :placeholder="
                form.hasKey
                  ? $t('global.printer.keepKey')
                  : $t('global.pleaseEnter')
              "
            />
            <el-tooltip :content="$t('global.printer.helpKey')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.printer.printerName')">
          <div class="field-with-tip">
            <el-input v-model="form.printerName" maxlength="64" />
            <el-tooltip :content="$t('global.printer.helpName')" placement="top">
              <el-icon class="field-tip-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.printer.printEnabled')">
          <el-switch
            v-model="form.printEnabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item :label="$t('global.printer.voiceEnabled')">
          <el-switch
            v-model="form.voiceEnabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item :label="$t('global.printer.copies')">
          <el-input-number v-model="form.copies" :min="1" :max="5" />
        </el-form-item>
        <el-form-item
          v-if="form.lastBindMsg"
          :label="$t('global.printer.lastBindMsg')"
        >
          <span>{{ form.lastBindMsg }}</span>
        </el-form-item>
        <el-form-item
          v-if="form.lastStatus"
          :label="$t('global.printer.lastStatus')"
        >
          <span>{{ form.lastStatus }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          :loading="statusLoading"
          :disabled="!form.bound"
          @click="handleQueryStatus"
        >
          {{ $t('global.btn.queryStatus') }}
        </el-button>
        <el-button
          :loading="testLoading"
          :disabled="!form.bound"
          @click="handleTestPrint"
        >
          {{ $t('global.btn.testPrint') }}
        </el-button>
        <el-button @click="dialogVisible = false">{{
          $t('global.btn.cancel')
        }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmDialog">
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

.field-with-tip .el-input {
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
