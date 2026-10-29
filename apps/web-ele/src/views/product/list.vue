<!-- eslint-disable vue/no-unused-refs -->
<!-- eslint-disable unicorn/prefer-spread -->
<!-- eslint-disable no-console -->
<!-- 商品列表页：左侧分类树 + 右侧模糊查询与列表 -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addProductApi,
  deleteProductApi,
  editProductApi,
  getCatagoryListApi,
  getProductListApi,
  getStoreListApi,
} from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import Tree from '#/components/tree/index.vue';
import { $t } from '#/locales';
import { currentMerchantStoreId, getDict, toRelativeFilePath } from '#/utils';

const userStore = useUserStore();
const isAdmin = computed(() => Number(userStore.userInfo?.identityType) === 3);

/**
 * 店铺小程序权限（「系统管理-小程序权限配置」中维护）：
 * showStock 控制商品弹窗是否可设置库存，enablePay 控制是否可设置价格/会员价
 */
const storeUi = reactive({
  showStock: true,
  enablePay: true,
});

const showStockField = computed(() => storeUi.showStock);
const showPayFields = computed(() => storeUi.enablePay);

function flagOn(value: any, fallback: boolean) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return Number(value) === 1;
}

/**
 * 拉取店铺小程序权限：库存是否展示、是否接入支付。
 * 取不到配置时按「全部展示」，保持原有录入能力。
 */
async function loadStoreUi(storeId?: any) {
  const id =
    storeId === null || storeId === undefined ? '' : String(storeId).trim();
  if (!id) {
    storeUi.showStock = true;
    storeUi.enablePay = true;
    return;
  }
  try {
    const res = await getStoreListApi({
      storeId: id,
      pageNum: 1,
      pageSize: 1,
    });
    if (res.code !== 200) {
      return;
    }
    const store = (res.data?.list || [])[0];
    if (!store) {
      return;
    }
    // 预约服务类店铺默认不展示库存，与后端 MiniappUiHelper 一致
    const defaultFlag = Number(store.miniappType) !== 2;
    storeUi.showStock = flagOn(store.showStock, defaultFlag);
    storeUi.enablePay = flagOn(store.enablePay, true);
  } catch (error) {
    console.log(error);
  }
}

const isLoading = ref(false);
const storeDict = reactive<Array<{ label: string; value: any }>>([]);
const treeKey = ref(0);
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
      prop: 'orderNum',
      label: $t('global.product.orderNum'),
      width: '90px',
    },
    {
      prop: 'price',
      label: $t('global.product.price'),
    },
    {
      prop: 'memberPrice',
      label: $t('global.product.memberPrice'),
      filter: (value: any) => {
        return value == null || value === '' ? '-' : value;
      },
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
      width: '280px',
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
const list = reactive<any[]>([]);

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
  ] as Array<Record<string, any>>,
});
//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref<Record<string, any>>({}); // 弹窗其他信息
// 弹窗表单配置（价格/会员价、库存按店铺权限动态显示）
const editConfigBase = [
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
    placeholder: '选填',
    append: {
      label: '元',
    },
  },
  {
    label: $t('global.product.memberPrice'),
    name: 'memberPrice',
    type: 'input',
    span: 24,
    onlyNumber: true,
    placeholder: '选填，须低于常规价',
    append: {
      label: '元',
    },
  },
  {
    label: $t('global.product.productNum'),
    name: 'productNum',
    type: 'input',
    span: 24,
    placeholder: '选填',
  },
  {
    label: $t('global.product.productStatus'),
    name: 'productStatus',
    type: 'select',
    span: 24,
    options: productStatusDict,
  },
  {
    label: $t('global.product.orderNum'),
    name: 'orderNum',
    type: 'number',
    span: 24,
    min: 0,
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
];
const editConfig = computed(() =>
  editConfigBase.filter((item) => {
    // 未开启「库存是否展示」→ 不显示库存设置
    if (item.name === 'productNum') {
      return showStockField.value;
    }
    // 未开启「是否接入支付功能」→ 不显示价格、会员价
    if (item.name === 'price' || item.name === 'memberPrice') {
      return showPayFields.value;
    }
    return true;
  }),
);
// 弹窗表单校验规则：价格、库存均为选填，只保留格式校验
const editRules = computed<Record<string, any>>(() => {
  const rules: Record<string, any> = {
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
  };
  if (showPayFields.value) {
    rules.price = [
      {
        pattern: /^\d+(\.\d+)?$/,
        message: `${$t('global.pleaseEnter')}数字`,
        trigger: 'blur',
      },
    ];
    rules.memberPrice = [
      {
        pattern: /^\d+(\.\d+)?$/,
        message: `${$t('global.pleaseEnter')}数字`,
        trigger: 'blur',
      },
    ];
  }
  return rules;
});

// 左侧树单选：按分类筛选商品
const handleTreeSelected = (currentData: any) => {
  console.log('currentData', currentData);
  selectedCatagoryId.value = currentData?.id ?? null;
  pageInfo.pageNum = 1;
  getProductList();
};

const clearCatagoryAndList = () => {
  selectedCatagoryId.value = null;
  treeKey.value += 1;
  treeData.value = [];
  catagoryOptions.splice(0, catagoryOptions.length);
  list.length = 0;
  total.value = 0;
};

const search = async (form: any) => {
  const prevStoreId = String(searchParams.value.storeId || '');
  const nextStoreId = String(form?.storeId || '');
  searchParams.value = { ...form };
  pageInfo.pageNum = 1;
  if (isAdmin.value && !nextStoreId) {
    ElMessage.warning($t('global.product.selectStore'));
    clearCatagoryAndList();
    return;
  }
  if (isAdmin.value && prevStoreId !== nextStoreId) {
    selectedCatagoryId.value = null;
    treeKey.value += 1;
    await Promise.all([getCatagoryTree(), loadStoreUi(nextStoreId)]);
  }
  getProductList();
};

const reset = () => {
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  searchParams.value = {};
  pageInfo.pageNum = 1;
  if (isAdmin.value) {
    clearCatagoryAndList();
    return;
  }
  selectedCatagoryId.value = null;
  treeKey.value += 1;
  getCatagoryTree();
  getProductList();
};

// 点击操作列按钮
const handleClick = async (row: any, label: string) => {
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
      // 打开前同步一次店铺权限，避免切换店铺后权限过期
      await loadStoreUi(resolveUiStoreId());
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
    memberPrice:
      data.memberPrice === '' || data.memberPrice == null
        ? 0
        : Number(data.memberPrice),
  };
  if (
    payload.memberPrice > 0 &&
    Number(payload.price) > 0 &&
    payload.memberPrice >= Number(payload.price)
  ) {
    ElMessage.warning('会员价须低于常规价');
    return;
  }
  if (isAdmin.value) {
    const storeId = searchParams.value.storeId;
    payload.storeId =
      storeId != null && storeId !== '' ? String(storeId) : undefined;
  } else {
    delete payload.storeId;
  }
  // 店铺未开启对应权限时，不提交相关字段（后端保留原值 / 走默认值）
  if (!showPayFields.value) {
    delete payload.price;
    delete payload.memberPrice;
  }
  if (!showStockField.value) {
    delete payload.productNum;
  }
  // 价格、库存为选填：空值统一转 null，避免空字符串提交到后端
  ['price', 'productNum'].forEach((key) => {
    if (key in payload) {
      const raw = payload[key];
      payload[key] =
        raw === '' || raw === null || raw === undefined ? null : Number(raw);
    }
  });
  const priceValue = Number(payload.price);
  // 已接入支付的店铺：新增的上架商品必须填价格，否则顾客下单会失败
  const isAdding = title === $t('global.btn.add');
  const onShelf =
    payload.productStatus === null ||
    payload.productStatus === undefined ||
    Number(payload.productStatus) === 1;
  if (
    isAdding &&
    showPayFields.value &&
    onShelf &&
    (payload.price === null || payload.price === undefined)
  ) {
    ElMessage.warning('该店铺已接入支付，请填写商品价格');
    return;
  }
  if (
    showPayFields.value &&
    payload.memberPrice > 0 &&
    Number.isFinite(priceValue) &&
    priceValue > 0 &&
    payload.memberPrice >= priceValue
  ) {
    ElMessage.warning('会员价须低于常规价');
    return;
  }
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
const handleAdd = async () => {
  if (isAdmin.value && !searchParams.value.storeId) {
    ElMessage.warning($t('global.product.selectStore'));
    return;
  }
  formTitle.value = $t('global.btn.add');
  // 默认挂到当前选中分类（可在弹窗下拉中修改），状态默认上架（1）
  formInfo.value = {
    catagoryId: selectedCatagoryId.value || undefined,
    productStatus: 1,
    orderNum: 0,
  };
  // 打开前同步一次店铺权限，避免切换店铺后权限过期
  await loadStoreUi(resolveUiStoreId());
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

const resolveStoreId = () => {
  const storeId = searchParams.value.storeId;
  return storeId != null && storeId !== '' ? String(storeId) : '';
};

/** 当前正在录入商品的店铺：管理员按过滤框所选店铺，商户取当前经营店铺 */
const resolveUiStoreId = () => {
  if (isAdmin.value) {
    return resolveStoreId();
  }
  return currentMerchantStoreId(userStore.userInfo);
};

// 获取商品列表
const getProductList = async () => {
  const obj: Record<string, any> = {
    ...searchParams.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
    // 左侧树选中的分类；未选则查该店全部商品
    catagoryId: selectedCatagoryId.value || undefined,
  };
  if (isAdmin.value) {
    const storeId = resolveStoreId();
    if (!storeId) {
      list.length = 0;
      total.value = 0;
      return;
    }
    obj.storeId = storeId;
  } else {
    delete obj.storeId;
  }
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

const applyCatagorySource = (listData: any[]) => {
  treeData.value = listData.map((item: any) => ({
    id: item.catagoryId,
    label: item.catagoryName,
  }));
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
};

// 获取左侧分类树：管理员按所选店铺，商户由后端限定本店
const getCatagoryTree = async () => {
  const params: Record<string, any> = {};
  if (isAdmin.value) {
    const storeId = resolveStoreId();
    if (!storeId) {
      applyCatagorySource([]);
      return;
    }
    params.storeId = storeId;
  }
  try {
    const res = await getCatagoryListApi(params);
    if (res.code === 200) {
      const source = res.data?.list || res.data || [];
      const listData = Array.isArray(source) ? source : [];
      applyCatagorySource(listData);
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

onMounted(async () => {
  // 获取商品状态字典值
  const dict1 = await getDict('product_status');
  productStatusDict.splice(0, productStatusDict.length, ...dict1);
  if (isAdmin.value) {
    formConfig.list.unshift({
      type: 'select',
      prop: 'storeId',
      label: $t('global.product.storeName'),
      value: '',
      placeholder: `${$t('global.pleaseSelect')}${$t('global.product.storeName')}`,
      options: storeDict,
      searchOnChange: true,
    });
    await getStoreList();
    return;
  }
  await getCatagoryTree();
  // 商户：按当前经营店铺的小程序权限决定价格/库存是否可录入
  await loadStoreUi(currentMerchantStoreId(userStore.userInfo));
  getProductList();
});
</script>

<template>
  <div v-loading="isLoading" class="product-list-page pd5">
    <!-- 左侧：商品分类树（一层） -->
    <el-card class="tree-card">
      <div class="tree-title">{{ $t('global.product.catagory') }}</div>
      <Tree
        :key="treeKey"
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
@use "#/styles/style.scss" as *;

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
