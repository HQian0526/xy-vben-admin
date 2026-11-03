<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addContractVarApi,
  deleteContractVarApi,
  editContractVarApi,
  getContractVarApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const isLoading = ref(false);
const total = ref(0);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({});
const list = reactive<any[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const saving = ref(false);
const form = reactive({
  id: '',
  varKey: '',
  varLabel: '',
  sourceType: 2,
  defaultValue: '',
  sort: 0,
  remark: '',
  status: 1,
  builtin: 0,
});

const isBuiltin = () => Number(form.builtin) === 1;

const tableConfig = reactive({
  list: [
    { prop: 'varKey', label: $t('global.contract.varKey'), width: '160px' },
    { prop: 'varLabel', label: $t('global.contract.varLabel') },
    {
      prop: 'sourceType',
      label: $t('global.contract.varSource'),
      width: '100px',
      filter: (value: any) =>
        Number(value) === 1
          ? $t('global.contract.varSystem')
          : $t('global.contract.varCustom'),
    },
    { prop: 'defaultValue', label: $t('global.contract.varDefault') },
    { prop: 'sort', label: $t('global.contract.varSort'), width: '80px' },
    {
      prop: 'status',
      label: $t('global.contract.varStatus'),
      width: '90px',
      filter: (value: any) =>
        Number(value) === 1 ? $t('global.btn.enable') : $t('global.btn.disable'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '160px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
        },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          isShow: (row: any) => Number(row.builtin) !== 1,
        },
      ],
    },
  ],
});

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'varKey',
      label: $t('global.contract.varKey'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.varKey')}`,
    },
    {
      type: 'input',
      prop: 'varLabel',
      label: $t('global.contract.varLabel'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.varLabel')}`,
    },
    {
      type: 'select',
      prop: 'sourceType',
      label: $t('global.contract.varSource'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.varSource')}`,
      options: [
        { label: $t('global.contract.varSystem'), value: '1', keepValue: true },
        { label: $t('global.contract.varCustom'), value: '2', keepValue: true },
      ],
    },
  ],
});

const search = (formData: any) => {
  searchParams.value = { ...formData };
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

const handleClick = (row: any, label: string) => {
  if (label === $t('global.btn.edit')) {
    openEdit(row);
  } else if (label === $t('global.btn.delete')) {
    handleDelete(row);
  }
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  getList();
};

const resetForm = () => {
  form.id = '';
  form.varKey = '';
  form.varLabel = '';
  form.sourceType = 2;
  form.defaultValue = '';
  form.sort = 0;
  form.remark = '';
  form.status = 1;
  form.builtin = 0;
};

const handleAdd = () => {
  resetForm();
  dialogTitle.value = $t('global.btn.add');
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  form.id = row.id;
  form.varKey = row.varKey;
  form.varLabel = row.varLabel;
  form.sourceType = Number(row.sourceType) || 2;
  form.defaultValue = row.defaultValue || '';
  form.sort = Number(row.sort) || 0;
  form.remark = row.remark || '';
  form.status = Number(row.status) === 0 ? 0 : 1;
  form.builtin = Number(row.builtin) || 0;
  dialogTitle.value = $t('global.btn.edit');
  dialogVisible.value = true;
};

const confirmSave = async () => {
  if (!form.varKey) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.varKey')}`);
    return;
  }
  if (!form.varLabel) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.varLabel')}`);
    return;
  }
  saving.value = true;
  try {
    const api = form.id ? editContractVarApi : addContractVarApi;
    const res = await api({ ...form });
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      dialogVisible.value = false;
      getList();
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } finally {
    saving.value = false;
  }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
    type: 'warning',
  })
    .then(async () => {
      const res = await deleteContractVarApi([row.id]);
      if (res.code === 200) {
        ElMessage.success($t('global.message.success'));
        getList();
      } else {
        ElMessage.error(res.msg || $t('global.message.error'));
      }
    })
    .catch(() => {});
};

const getList = async () => {
  try {
    isLoading.value = true;
    const res = await getContractVarApi({
      ...searchParams.value,
      pageNum: pageInfo.pageNum,
      pageSize: pageInfo.pageSize,
    });
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data.list || []));
      total.value = res.data.total || 0;
    } else {
      ElMessage.error($t('global.message.searchError'));
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(getList);
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
      <el-form label-width="120px">
        <el-form-item :label="$t('global.contract.varKey')" required>
          <el-input
            v-model="form.varKey"
            maxlength="64"
            :disabled="isBuiltin()"
            :placeholder="$t('global.contract.varKeyPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('global.contract.varLabel')" required>
          <el-input v-model="form.varLabel" maxlength="64" />
        </el-form-item>
        <el-form-item v-if="form.sourceType !== 1" :label="$t('global.contract.varDefault')">
          <el-input v-model="form.defaultValue" maxlength="255" />
        </el-form-item>
        <el-form-item :label="$t('global.contract.varSort')">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item :label="$t('global.contract.varStatus')">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">{{ $t('global.btn.enable') }}</el-radio>
            <el-radio :value="0">{{ $t('global.btn.disable') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('global.contract.remark')">
          <el-input v-model="form.remark" maxlength="255" />
        </el-form-item>
        <p class="hint">{{ $t('global.contract.varHint') }}</p>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('global.btn.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">
          {{ $t('global.btn.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.hint {
  margin: 0 0 0 120px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
