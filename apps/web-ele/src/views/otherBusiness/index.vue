<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addOtherBusinessApi,
  deleteOtherBusinessApi,
  editOtherBusinessApi,
  getOtherBusinessListApi,
  getStoreListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const isLoading = ref(false);
//* *************table相关变量**************
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const storeDict = reactive<Array<{ label: string; value: any }>>([]); // 商户下拉
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'storeName',
      label: $t('global.otherBusiness.storeName'),
    },
    {
      prop: 'businessName',
      label: $t('global.otherBusiness.businessName'),
    },
    {
      prop: 'businessDesc',
      label: $t('global.otherBusiness.businessDesc'),
    },
    {
      prop: 'businessFee',
      label: $t('global.otherBusiness.businessFee'),
    },
    {
      prop: 'createdBy',
      label: $t('global.createdBy'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '200px',
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
// 表格数据
const list = reactive([]);

//* *************filter相关变量**************
// const isCollapsed = ref(false);
// 头部搜索框
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'businessName',
      label: $t('global.otherBusiness.businessName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.otherBusiness.businessName')}`,
    },
    {
      type: 'select',
      prop: 'storeId',
      label: $t('global.otherBusiness.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.otherBusiness.storeName')}`,
      options: storeDict,
    },
  ],
});
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.otherBusiness.businessName'),
    name: 'businessName',
    type: 'input',
    span: 24,
  },
  {
    label: $t('global.otherBusiness.businessDesc'),
    name: 'businessDesc',
    type: 'textarea',
    span: 24,
  },
  {
    label: $t('global.otherBusiness.businessFee'),
    name: 'businessFee',
    type: 'input',
    span: 24,
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  businessName: [
    {
      required: true,
      message: $t('global.otherBusiness.businessName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  businessFee: [
    {
      required: true,
      message: $t('global.otherBusiness.businessFee') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});

// 点击展开收起
// const toggleCollapse = () => {
//   isCollapsed.value = !isCollapsed.value;
// };

const search = (form: any) => {
  console.log('form', form);
  getOtherBusinessList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getOtherBusinessList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    // 编辑
    case $t('global.btn.edit'): {
      // 编辑
      formTitle.value = label;
      formInfo.value = {
        ...row,
      }; // 确保是新的对象引用
      itemVisible.value = true;
      break;
    }
    // 删除
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
    // No default
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getOtherBusinessList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getOtherBusinessList();
};

// 关闭编辑弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

// 确定编辑弹窗
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  try {
    const payload = { ...data };
    // 新增时由后端雪花生成 id / storeId，避免空串导致反序列化失败
    if (title === $t('global.btn.add')) {
      delete payload.id;
      delete payload.storeId;
    }
    const res =
      title === $t('global.btn.add')
        ? await addOtherBusinessApi(payload)
        : await editOtherBusinessApi(payload);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getOtherBusinessList();
      itemVisible.value = false;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg,
      });
    }
  } catch {}
};

// 新增
const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  formInfo.value = {}; // 清空表单数据
  itemVisible.value = true;
};

// 删除
const handleDelete = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await deleteOtherBusinessApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getOtherBusinessList();
      } else {
        ElMessage({
          type: 'error',
          message: $t('global.message.error'),
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// 获取其他业务列表
const getOtherBusinessList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getOtherBusinessListApi(obj);
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

// 获取商户列表
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

onMounted(() => {
  getOtherBusinessList(); // 获取其他业务列表
  getStoreList(); // 获取商户下拉
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset">
        <template #extra>
          <!-- <el-button link type="primary" @click="toggleCollapse">
            {{
              isCollapsed
                ? $t('global.btn.expandMore')
                : $t('global.btn.collapseMore')
            }}
          </el-button> -->
          <!-- v-show="!isCollapsed" -->
          <div class="button-group">
            <el-button type="success" :icon="Plus" @click="handleAdd">
              {{ $t('global.btn.add') }}
            </el-button>
          </div>
        </template>
      </Filter>
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
    <!-- 编辑弹窗 -->
    <Edit
      ref="editForm"
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
@import "#/styles/style.scss";

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
