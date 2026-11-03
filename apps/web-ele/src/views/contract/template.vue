<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addContractTempApi,
  deleteContractTempApi,
  editContractTempApi,
  getContractTempApi,
  getContractVarApi,
} from '#/api';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

import ContractBodyEditor from './ContractBodyEditor.vue';
import { CONTRACT_VARS, skeletonByPartyType } from './contractContent';

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
const insertVars = ref<Array<{ key: string; label: string }>>([...CONTRACT_VARS]);
const form = reactive({
  id: '',
  templateName: '',
  partyType: 1,
  content: '',
  remark: '',
  status: 1,
});

const tableConfig = reactive({
  list: [
    { prop: 'templateName', label: $t('global.contract.templateName') },
    {
      prop: 'partyType',
      label: $t('global.contract.partyType'),
      width: '100px',
      filter: (value: any) =>
        Number(value) === 2 ? $t('global.contract.enterprise') : $t('global.contract.person'),
    },
    {
      prop: 'status',
      label: $t('global.contract.contractStatus'),
      width: '90px',
      filter: (value: any) => (Number(value) === 1 ? '启用' : '停用'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '170px',
      filter: (value: any) => (value ? String(value).slice(0, 19) : ''),
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
      prop: 'templateName',
      label: $t('global.contract.templateName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.contract.templateName')}`,
    },
    {
      type: 'select',
      prop: 'partyType',
      label: $t('global.contract.partyType'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.contract.partyType')}`,
      options: [
        { label: $t('global.contract.person'), value: '1', keepValue: true },
        { label: $t('global.contract.enterprise'), value: '2', keepValue: true },
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
  form.templateName = '';
  form.partyType = 1;
  form.content = '';
  form.remark = '';
  form.status = 1;
};

const handleAdd = () => {
  resetForm();
  form.content = skeletonByPartyType(form.partyType);
  dialogTitle.value = $t('global.btn.add');
  dialogVisible.value = true;
};

const onPartyTypeChange = (val: number) => {
  const next = skeletonByPartyType(val);
  const prev = skeletonByPartyType(val === 2 ? 1 : 2);
  if (!form.content.trim() || form.content === prev) {
    form.content = next;
  }
};

const openEdit = (row: any) => {
  form.id = row.id;
  form.templateName = row.templateName;
  form.partyType = Number(row.partyType) || 1;
  form.content = row.content || '';
  form.remark = row.remark || '';
  form.status = Number(row.status) === 0 ? 0 : 1;
  dialogTitle.value = $t('global.btn.edit');
  dialogVisible.value = true;
};

const confirmSave = async () => {
  if (!form.templateName) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.templateName')}`);
    return;
  }
  if (!form.content.trim()) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.contentTemplate')}`);
    return;
  }
  saving.value = true;
  try {
    const api = form.id ? editContractTempApi : addContractTempApi;
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
      const res = await deleteContractTempApi([row.id]);
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
    const res = await getContractTempApi({
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

const loadVars = async () => {
  try {
    const res = await getContractVarApi({ pageNum: 1, pageSize: 200, status: 1 });
    if (res.code === 200 && res.data?.list?.length) {
      insertVars.value = res.data.list.map((item: any) => ({
        key: item.varKey,
        label: item.varLabel,
      }));
    }
  } catch {
    /* keep builtin fallback */
  }
};

onMounted(() => {
  getList();
  loadVars();
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
      width="920px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="120px">
        <el-form-item :label="$t('global.contract.templateName')" required>
          <el-input v-model="form.templateName" maxlength="128" />
        </el-form-item>
        <el-form-item :label="$t('global.contract.partyType')">
          <el-radio-group v-model="form.partyType" @change="onPartyTypeChange">
            <el-radio :value="1">{{ $t('global.contract.person') }}</el-radio>
            <el-radio :value="2">{{ $t('global.contract.enterprise') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('global.contract.contentTemplate')" required>
          <div class="content-wrap">
            <p class="hint">{{ $t('global.contract.templateHint') }}</p>
            <ContractBodyEditor
              v-model="form.content"
              show-insert
              :vars="insertVars"
              :rows="18"
              :placeholder="$t('global.contract.templatePlaceholder')"
            />
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.contract.remark')">
          <el-input v-model="form.remark" maxlength="255" />
        </el-form-item>
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

.content-wrap {
  width: 100%;
}

.hint {
  margin: 0 0 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
