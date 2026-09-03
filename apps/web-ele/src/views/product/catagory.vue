<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<!-- 商品分类列表页 -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addCatagoryApi,
  deleteCatagoryApi,
  editCatagoryApi,
  getCatagoryListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { getDict } from '#/utils';

const isLoading = ref(false);
//* *************table相关变量**************
const catagoryStatusDict = reactive<Array<{ label: string; value: any }>>([]); // 商品分类状态字典
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'catagoryId',
      label: $t('global.product.catagoryId'),
    },
    {
      prop: 'catagoryName',
      label: $t('global.product.catagoryName'),
    },
    {
      prop: 'orderNum',
      label: $t('global.product.orderNum'),
      type: 'number',
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'catagoryStatus',
      label: $t('global.product.catagoryStatus'),
      type: 'select',
      options: catagoryStatusDict,
      // filter: (value: any) => {
      //   return value
      //     ? $t('global.product.lock')
      //     : $t('global.product.normal');
      // },
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '200px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.save'),
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
// 头部搜索框：分类名称模糊查询
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'catagoryName',
      label: $t('global.product.catagoryName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.product.catagoryName')}`,
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
    label: $t('global.product.catagoryName'),
    name: 'catagoryName',
    type: 'input',
    span: 24,
  },
  {
    label: $t('global.product.catagoryStatus'),
    name: 'catagoryStatus',
    type: 'select',
    span: 24,
    options: catagoryStatusDict,
  },
  {
    label: $t('global.product.orderNum'),
    name: 'orderNum',
    type: 'number',
    span: 24,
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  catagoryId: [
    {
      required: true,
      message: $t('global.product.catagoryId') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  catagoryName: [
    {
      required: true,
      message: $t('global.product.catagoryName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});

const search = (form: any) => {
  console.log('form', form);
  getCatagoryList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getCatagoryList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    // 删除
    case $t('global.btn.delete'): {
      handleDelete(row);
      break;
    }
    // 保存：直接调用编辑接口
    case $t('global.btn.save'): {
      handleSave(row);
      break;
    }
    // No default
  }
};

// 保存（行内编辑后调用编辑接口）
const handleSave = async (row: any) => {
  console.log('row', row);
  try {
    const res = await editCatagoryApi({ ...row });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getCatagoryList();
    } else {
      ElMessage({
        type: 'error',
        message: res.msg,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getCatagoryList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getCatagoryList();
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
    const res =
      title === $t('global.btn.add')
        ? await addCatagoryApi({ ...data })
        : await editCatagoryApi({ ...data });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getCatagoryList();
      itemVisible.value = false;
    } else {
      console.log('res', res);
      ElMessage({
        type: 'error',
        message: res.message,
      });
    }
  } catch {}
};

// 新增
const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  // 状态默认选中 value 为 1 的项
  formInfo.value = {
    catagoryStatus: 1,
  };
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
      const res = await deleteCatagoryApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getCatagoryList();
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

// 获取商品分类列表
const getCatagoryList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getCatagoryListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...res.data.list); // 添加新数据
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

onMounted(async () => {
  // 获取商品分类状态字典值
  const dict1 = await getDict('product_status');
  catagoryStatusDict.splice(0, catagoryStatusDict.length, ...dict1);
  getCatagoryList(); // 获取商品分类列表
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <!-- 头部搜索框 -->
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
@use "#/styles/style.scss" as *;

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
