<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addStoreStaffApi,
  deleteStoreStaffApi,
  editStoreStaffApi,
  getStoreListApi,
  getStoreStaffListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
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
// 暂时不需要停用，状态筛选先关掉
// const statusDict = [
//   { label: $t('global.storeStaff.enabled'), value: 1 },
//   { label: $t('global.storeStaff.disabled'), value: 0 },
// ];

const tableConfig = reactive({
  list: [
    {
      prop: 'realName',
      label: $t('global.storeStaff.realName'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'phone',
      label: $t('global.storeStaff.phone'),
    },
    {
      prop: 'storeName',
      label: $t('global.storeStaff.storeName'),
      filter: (value: any) => value || '—',
    },
    // {
    //   prop: 'status',
    //   type: 'tag',
    //   label: $t('global.storeStaff.status'),
    //   width: '100px',
    //   tagType: (row: any) => (Number(row.status) === 1 ? 'success' : 'info'),
    //   filter: (value: any) =>
    //     Number(value) === 1
    //       ? $t('global.storeStaff.enabled')
    //       : $t('global.storeStaff.disabled'),
    // },
    {
      prop: 'remark',
      label: $t('global.storeStaff.remark'),
      filter: (value: any) => value || '—',
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      width: '180px',
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
        // {
        //   type: 'warning',
        //   label: $t('global.btn.disable'),
        //   isShow: (item: any) => Number(item.status) === 1,
        // },
        // {
        //   type: 'success',
        //   label: $t('global.btn.enable'),
        //   isShow: (item: any) => Number(item.status) !== 1,
        // },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          isShow: () => true,
        },
      ],
    },
  ],
});
const list = reactive([]);

const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'phone',
      label: $t('global.storeStaff.phone'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.storeStaff.phone')}`,
    },
    {
      type: 'input',
      prop: 'realName',
      label: $t('global.storeStaff.realName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.storeStaff.realName')}`,
    },
    // {
    //   type: 'select',
    //   prop: 'status',
    //   label: $t('global.storeStaff.status'),
    //   value: '',
    //   placeholder: `${$t('global.pleaseSelect')}${$t('global.storeStaff.status')}`,
    //   options: statusDict,
    // },
  ] as Array<Record<string, any>>,
});

const itemVisible = ref(false);
const formTitle = ref('');
const formInfo = ref({});
const isEdit = computed(() => formTitle.value === $t('global.btn.edit'));
const editConfig = computed(() => {
  const fields: Array<Record<string, any>> = [];
  if (isAdmin.value && !isEdit.value) {
    fields.push({
      label: $t('global.storeStaff.storeName'),
      name: 'storeId',
      type: 'select',
      span: 24,
      options: storeDict,
    });
  }
  fields.push({
    label: $t('global.storeStaff.phone'),
    name: 'phone',
    type: 'input',
    span: 24,
    readonly: isEdit.value,
    placeholder: $t('global.storeStaff.phonePlaceholder'),
  });
  // if (isEdit.value) {
  //   fields.push({
  //     label: $t('global.storeStaff.status'),
  //     name: 'status',
  //     type: 'select',
  //     span: 24,
  //     options: statusDict,
  //   });
  // }
  fields.push({
    label: $t('global.storeStaff.remark'),
    name: 'remark',
    type: 'textarea',
    span: 24,
  });
  return fields;
});
const editRules = computed(() => {
  const rules: Record<string, any> = {};
  if (!isEdit.value) {
    rules.phone = [
      {
        required: true,
        message: $t('global.storeStaff.phone') + $t('global.required'),
        trigger: 'blur',
      },
      {
        pattern: /^1[3-9]\d{9}$/,
        message: $t('global.storeStaff.phone') + $t('global.errorFormat'),
        trigger: 'blur',
      },
    ];
    if (isAdmin.value) {
      rules.storeId = [
        {
          required: true,
          message: $t('global.storeStaff.storeName') + $t('global.required'),
          trigger: 'change',
        },
      ];
    }
  }
  return rules;
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

const search = (form: any) => {
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getStaffList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getStaffList();
};

const handleClick = (row: any, label: string) => {
  switch (label) {
    case $t('global.btn.edit'): {
      handleEdit(row);
      break;
    }
    // case $t('global.btn.enable'): {
    //   handleToggleStatus(row, 1);
    //   break;
    // }
    // case $t('global.btn.disable'): {
    //   handleToggleStatus(row, 0);
    //   break;
    // }
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
    // No default
  }
};

const handleCurrentChange = (currentPage: number) => {
  pageInfo.pageNum = currentPage;
  getStaffList();
};

const handleSizeChange = (pageSize: number) => {
  pageInfo.pageSize = pageSize;
  getStaffList();
};

const closeDialog = () => {
  itemVisible.value = false;
};

const confirmDialog = async (_title: string, data: any) => {
  try {
    if (isEdit.value) {
      const res = await editStoreStaffApi({
        id: formInfo.value && (formInfo.value as any).id,
        remark: data.remark,
      });
      if (res.code === 200) {
        ElMessage({ type: 'success', message: $t('global.message.success') });
        getStaffList();
        itemVisible.value = false;
      } else {
        showErrorMessage(res.msg || $t('global.message.error'));
      }
      return;
    }
    const payload: Record<string, any> = {
      phone: data.phone,
      remark: data.remark,
    };
    if (!isAdmin.value) {
      delete payload.storeId;
    } else if (data.storeId != null && data.storeId !== '') {
      payload.storeId = String(data.storeId);
    }
    const res = await addStoreStaffApi(payload);
    if (res.code === 200) {
      ElMessage({ type: 'success', message: $t('global.message.success') });
      getStaffList();
      itemVisible.value = false;
    } else {
      showErrorMessage(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg ||
      error?.response?.data?.message ||
      error?.msg;
    if (msg) {
      showErrorMessage(msg);
    }
  }
};

const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  formInfo.value = { status: 1 };
  itemVisible.value = true;
};

const handleEdit = (row: any) => {
  formTitle.value = $t('global.btn.edit');
  formInfo.value = {
    id: row.id,
    phone: row.phone,
    status: Number(row.status) === 1 ? 1 : 0,
    remark: row.remark || '',
  };
  itemVisible.value = true;
};

// const handleToggleStatus = (row: any, status: number) => {
//   const tip =
//     status === 1
//       ? $t('global.message.confirmUnlock')
//       : $t('global.message.confirmDisable');
//   ElMessageBox.confirm(tip, $t('global.tip'), {
//     confirmButtonText: $t('global.btn.confirm'),
//     cancelButtonText: $t('global.btn.cancel'),
//     type: 'warning',
//   })
//     .then(async () => {
//       const res = await editStoreStaffApi({ id: row.id, status });
//       if (res.code === 200) {
//         ElMessage({ type: 'success', message: $t('global.message.success') });
//         getStaffList();
//       } else {
//         showErrorMessage(res.msg || $t('global.message.error'));
//       }
//     })
//     .catch(() => {});
// };

const handleDelete = (row: any) => {
  ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
    type: 'warning',
  })
    .then(async () => {
      const res = await deleteStoreStaffApi([row.id]);
      if (res.code === 200) {
        ElMessage({ type: 'success', message: $t('global.message.success') });
        getStaffList();
      } else {
        showErrorMessage(res.msg || $t('global.message.error'));
      }
    })
    .catch(() => {});
};

const getStaffList = async () => {
  const obj: Record<string, any> = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  if (!isAdmin.value) {
    delete obj.storeId;
  } else if (obj.storeId != null && obj.storeId !== '') {
    obj.storeId = String(obj.storeId);
  }
  try {
    isLoading.value = true;
    const res = await getStoreStaffListApi(obj);
    if (res.code === 200) {
      list.length = 0;
      list.push(...(res.data.list || []));
      total.value = res.data.total || 0;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || $t('global.message.searchError'),
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const getStoreList = async () => {
  try {
    const res = await getStoreListApi({ pageSize: 9999, pageNum: 1, deleted: 0 });
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
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  if (isAdmin.value) {
    formConfig.list.push({
      type: 'select',
      prop: 'storeId',
      label: $t('global.storeStaff.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.storeStaff.storeName')}`,
      options: storeDict,
    });
    await getStoreList();
  }
  getStaffList();
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
    <Edit
      label-width="100px"
      :form-config="editConfig"
      :form-rules="editRules"
      :title="formTitle"
      :form-info="formInfo"
      :visible="itemVisible"
      @close="closeDialog"
      @confirm="confirmDialog"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.button-group {
  display: inline-flex;
  margin-left: 10px;
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
</style>
