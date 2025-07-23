<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { addDictApi, deleteDictApi, editDictApi, getDictListApi } from '#/api';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const isLoading = ref(false);
//* *************table相关变量**************
const total = ref(10);
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'index',
    },
    {
      prop: 'code',
      label: $t('global.dict.code'),
    },
    {
      prop: 'dictName',
      label: $t('global.dict.dictName'),
    },
    {
      prop: 'remark',
      label: $t('global.dict.remark'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '200px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.detail'),
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
const isCollapsed = ref(false);
// 头部搜索框
const formConfig = reactive({
  list: [
    {
      type: 'input',
      prop: 'dictName',
      label: $t('global.dict.dictName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.dict.dictName')}`,
    },
    {
      type: 'input',
      prop: 'code',
      label: $t('global.dict.code'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.dict.code')}`,
    },
  ],
});

//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单校验规则
const editRules = reactive({
  dictName: [
    {
      required: true,
      message: $t('global.dict.dictName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  code: [
    {
      required: true,
      message: $t('global.dict.code') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.dict.code'),
    name: 'code',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.dict.dictName'),
    name: 'dictName',
    type: 'input',
    readonly: false,
  },
  {
    label: $t('global.dict.remark'),
    name: 'remark',
    type: 'textarea',
    readonly: false,
    span: 24,
  },
]);
// 弹窗内表格配置
const editTableConfig = reactive({
  list: [
    {
      prop: 'index',
    },
    {
      prop: 'key',
      label: $t('global.dict.key'),
      type: 'input',
    },
    {
      prop: 'value',
      label: $t('global.dict.value'),
      type: 'input',
    },
    {
      prop: 'remark',
      label: $t('global.dict.remark'),
      type: 'input',
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '100px',
      operations: [
        {
          type: 'danger',
          label: $t('global.btn.delete'),
          show: true,
        },
      ],
    },
  ],
});
// 弹窗内表格数据
const editTableList = ref([]);

// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 点击搜索
const search = (form: any) => {
  console.log('form', form);
  getDictList(form);
};

// 点击重置
const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item: any) => {
    item.value = null;
  });
  getDictList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  if (label === $t('global.btn.detail')) {
    // 详情
    formTitle.value = label;
    formInfo.value = { ...row }; // 确保是新的对象引用
    editTableList.value = JSON.parse(row.dictJson);
    itemVisible.value = true;
  } else if (label === $t('global.btn.delete')) {
    // 删除
    handleDelete(row);
  }
};

// 点击弹窗内表格操作列按钮
const editTableClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  if (label === $t('global.btn.delete')) {
    const index = editTableList.value.indexOf(row);
    if (index !== -1) {
      editTableList.value.splice(index, 1);
    }
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getDictList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getDictList();
};

// 关闭弹窗
const closeDialog = () => {
  editTableList.value = []; // 使用 ref 时这样清空
  formInfo.value = {}; // 同时清空表单数据
  itemVisible.value = false;
};

// 确定
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  try {
    const res =
      title === $t('global.btn.add')
        ? await addDictApi({
            ...data,
            dictJson: JSON.stringify(editTableList.value),
          })
        : await editDictApi({
            ...data,
            dictJson: JSON.stringify(editTableList.value),
          });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getDictList();
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
  editTableList.value = []; // 明确清空表格数据
  itemVisible.value = true;
};

// 弹窗内表格新增项
const editTableAdd = async () => {
  editTableList.value.push({
    key: '',
    value: '',
    remark: '',
  });
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
      const res = await deleteDictApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getDictList();
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

// 获取字典列表
const getDictList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getDictListApi(obj);
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

onMounted(() => {
  getDictList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <!-- 头部搜索框 -->
      <Filter :form-config="formConfig" @search="search" @reset="reset">
        <template #extra>
          <el-button link type="primary" @click="toggleCollapse">
            {{
              isCollapsed
                ? $t('global.btn.expandMore')
                : $t('global.btn.collapseMore')
            }}
          </el-button>

          <div v-show="!isCollapsed" class="button-group">
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
    <!-- 弹窗 -->
    <Edit
      ref="editForm"
      :form-config="editConfig"
      :form-rules="editRules"
      :title="formTitle"
      :form-info="formInfo"
      :visible="itemVisible"
      @close="closeDialog"
      @confirm="confirmDialog"
    >
      <template #slot>
        <!-- 弹窗内的表格 -->
        <el-button type="primary" @click="editTableAdd">
          {{ $t('global.btn.addDictItem') }}
        </el-button>
        <Table
          :pagination="false"
          :table-config="editTableConfig"
          :list="editTableList"
          @handle-click="editTableClick"
        />
      </template>
    </Edit>
  </div>
</template>

<style lang="scss" scoped>
.table-box {
  height: calc(100vh - 180px);
  overflow-y: auto;
}

.button-group {
  display: inline-flex;
  margin-left: 10px;
}
</style>
