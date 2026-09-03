<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<!-- 商品列表页：左侧分类树 + 右侧模糊查询与列表 -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addProductApi,
  deleteProductApi,
  editProductApi,
  getCatagoryListApi,
  getProductListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import Tree from '#/components/tree/index.vue';
import { $t } from '#/locales';
import { getDict, toRelativeFilePath } from '#/utils';

const isLoading = ref(false);
//* *************左侧树相关变量**************
const treeData = ref<Array<{ id: any; label: string }>>([]); // 一层分类树数据
const selectedCatagoryId = ref<any>(null); // 当前选中的分类id
// 弹窗「所属分类」下拉选项（与左侧树同源）
const catagoryOptions = reactive<Array<{ label: string; value: any }>>([]);
//* *************table相关变量**************
const productStatusDict = reactive<Array<{ label: string; value: any }>>([]); // 商品状态字典
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const searchParams = ref<Record<string, any>>({}); // 缓存查询条件，供分页复用
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'productImg',
      label: $t('global.product.productImg'),
      type: 'image',
      width: '90px',
    },
    {
      prop: 'productName',
      label: $t('global.product.productName'),
    },
    {
      prop: 'price',
      label: $t('global.product.price'),
    },
    {
      prop: 'productNum',
      label: $t('global.product.productNum'),
    },
    {
      prop: 'saleNum',
      label: $t('global.product.saleNum'),
    },
    {
      prop: 'remark',
      label: $t('global.product.remark'),
    },
    {
      prop: 'createdBy',
      label: $t('global.product.createdBy'),
    },
    {
      prop: 'createdTime',
      label: $t('global.createdTime'),
      filter: (value: any) => {
        return value ? value.slice(0, 10) : '';
      },
    },
    {
      prop: 'productStatus',
      label: $t('global.product.productStatus'),
      filter: (value: any) => {
        const hit = productStatusDict.find(
          (item) => Number(item.value) === Number(value),
        );
        return hit ? hit.label : value;
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
          label: $t('global.btn.offShelf'),
          isShow: (item: any) => Number(item.productStatus) === 1,
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
// 头部搜索框：商品名称、状态模糊/筛选
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'productName',
      label: $t('global.product.productName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.product.productName')}`,
    },
    {
      type: 'select',
      prop: 'productStatus',
      label: $t('global.product.productStatus'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.product.productStatus')}`,
      options: productStatusDict,
    },
  ],
});
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref<Record<string, any>>({}); // 弹窗其他信息
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.product.belongCatagory'),
    name: 'catagoryId',
    type: 'select',
    span: 24,
    options: catagoryOptions,
  },
  {
    label: $t('global.product.productName'),
    name: 'productName',
    type: 'input',
    span: 24,
  },
  {
    label: $t('global.product.price'),
    name: 'price',
    type: 'input',
    span: 24,
    onlyNumber: true,
    append: {
      label: '元',
    },
  },
  {
    label: $t('global.product.productNum'),
    name: 'productNum',
    type: 'input',
    span: 24,
  },
  {
    label: $t('global.product.productStatus'),
    name: 'productStatus',
    type: 'select',
    span: 24,
    options: productStatusDict,
  },
  {
    label: $t('global.product.remark'),
    name: 'remark',
    type: 'textarea',
    span: 24,
  },
  {
    label: $t('global.product.productImg'),
    name: 'productImg',
    type: 'uploadImg',
    span: 24,
    limit: 1,
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  catagoryId: [
    {
      required: true,
      message: $t('global.product.belongCatagory') + $t('global.required'),
      trigger: 'change',
    },
  ],
  productName: [
    {
      required: true,
      message: $t('global.product.productName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  price: [
    {
      required: true,
      message: $t('global.product.price') + $t('global.required'),
      trigger: 'blur',
    },
    {
      pattern: /^\d+(\.\d+)?$/,
      message: `${$t('global.pleaseEnter')}数字`,
      trigger: 'blur',
    },
  ],
  productNum: [
    {
      required: true,
      message: $t('global.product.productNum') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});

// 左侧树单选：按分类筛选商品
const handleTreeSelected = (currentData: any) => {
  console.log('currentData', currentData);
  selectedCatagoryId.value = currentData?.id ?? null;
  pageInfo.pageNum = 1;
  getProductList();
};

const search = (form: any) => {
  console.log('form', form);
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  getProductList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  getProductList(form);
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
    // 编辑
    case $t('global.btn.edit'): {
      formTitle.value = label;
      formInfo.value = {
        ...row,
      }; // 确保是新的对象引用
      itemVisible.value = true;
      break;
    }
    // 下架
    case $t('global.btn.offShelf'): {
      handleOffShelf(row);
      break;
    }
    // No default
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getProductList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getProductList();
};

// 关闭编辑弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

// 确定编辑弹窗
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  // 处理商品图片：提交相对路径，不传完整回显地址
  const productImg = Array.isArray(data.productImg)
    ? data.productImg
        .map((item: any) => toRelativeFilePath(item))
        .filter(Boolean)
        .join(',')
    : toRelativeFilePath(data.productImg);
  const payload = {
    ...data,
    productImg,
    catagoryId: data.catagoryId || selectedCatagoryId.value,
  };
  try {
    const res =
      title === $t('global.btn.add')
        ? await addProductApi(payload)
        : await editProductApi(payload);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getProductList();
      itemVisible.value = false;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || res.message,
      });
    }
  } catch {}
};

// 新增
const handleAdd = () => {
  formTitle.value = $t('global.btn.add');
  // 默认挂到当前选中分类（可在弹窗下拉中修改），状态默认上架（1）
  formInfo.value = {
    catagoryId: selectedCatagoryId.value || undefined,
    productStatus: 1,
  };
  itemVisible.value = true;
};

// 下架：将商品状态改为下架
const handleOffShelf = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm(
      $t('global.message.confirmOffShelf'),
      $t('global.tip'),
      {
        confirmButtonText: $t('global.btn.confirm'),
        cancelButtonText: $t('global.btn.cancel'),
        type: 'warning',
      },
    ).then(async () => {
      const res = await editProductApi({ id: row.id, productStatus: 0 });
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getProductList();
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

// 删除
const handleDelete = (row: any) => {
  console.log('row', row);
  try {
    ElMessageBox.confirm($t('global.message.confirmDelete'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await deleteProductApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getProductList();
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

// 获取商品列表
const getProductList = async (form: any = undefined) => {
  const query = form === undefined ? searchParams.value : form;
  const obj = {
    ...query,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
    // 左侧树选中的分类
    catagoryId: selectedCatagoryId.value || undefined,
  };
  try {
    isLoading.value = true;
    const res = await getProductListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...(res.data.list || [])); // 添加新数据
      total.value = res.data.total || 0;
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

// 获取左侧分类树（不传参，返回一层数据）
const getCatagoryTree = async () => {
  try {
    const res = await getCatagoryListApi();
    if (res.code === 200) {
      const source = res.data?.list || res.data || [];
      const listData = Array.isArray(source) ? source : [];
      // 转成树组件需要的一层结构：id / label
      treeData.value = listData.map((item: any) => ({
        id: item.catagoryId,
        label: item.catagoryName,
      }));
      // 同步弹窗「所属分类」下拉选项
      catagoryOptions.splice(
        0,
        catagoryOptions.length,
        ...listData.map((item: any) => ({
          label: item.catagoryName,
          value: item.catagoryId,
          // 分类id可能为雪花算法长整型，避免被转 Number 丢精度
          keepValue: true,
        })),
      );
    } else {
      ElMessage({
        type: 'error',
        message: $t('global.message.searchError'),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  // 获取商品状态字典值
  const dict1 = await getDict('product_status');
  productStatusDict.splice(0, productStatusDict.length, ...dict1);
  console.log('productStatusDict', productStatusDict);
  await getCatagoryTree(); // 获取左侧分类树
  getProductList(); // 获取商品列表
});
</script>

<template>
  <div v-loading="isLoading" class="product-list-page pd5">
    <!-- 左侧：商品分类树（一层） -->
    <el-card class="tree-card">
      <div class="tree-title">{{ $t('global.product.catagory') }}</div>
      <Tree
        :tree-data="treeData"
        :show-checkbox="false"
        @selected="handleTreeSelected"
      />
    </el-card>
    <!-- 右侧：头部查询 + 底部列表 -->
    <div class="right-content">
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
    </div>
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

.product-list-page {
  flex-direction: row;
  gap: 10px;
}

.tree-card {
  flex-shrink: 0;
  width: 240px;
  min-height: 0;
  overflow-y: auto;
}

.tree-title {
  margin-bottom: 10px;
  font-weight: 600;
}

.right-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-box {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
