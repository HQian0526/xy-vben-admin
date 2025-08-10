<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import { addMenuApi, deleteMenuApi, editMenuApi, getMenuListApi } from '#/api';
import Edit from '#/components/edit/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';

const router = useRouter();
const isLoading = ref(false);
//* *************table相关变量**************
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'index',
      label: 'id',
    },
    {
      prop: 'menuName',
      label: $t('global.menu.menuName'),
    },
    {
      prop: 'menuCode',
      label: $t('global.menu.menuCode'),
    },
    {
      prop: 'menuType',
      label: $t('global.menu.menuType'),
      filter: (value: any) => {
        if (value === 1) {
          return $t('global.menu.package');
        } else if (value === 2) {
          return $t('global.menu.munu');
        } else {
          return $t('global.menu.button');
        }
      },
    },
    {
      prop: 'path',
      label: $t('global.menu.linkUrl'),
      filter: (value: any) => {
        return value || '--';
      },
    },
    {
      prop: 'sort',
      label: $t('global.menu.sort'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '230px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.linkTo'),
          isShow: (item: any) => item.menuType === 2,
        },
        {
          type: 'primary',
          label: $t('global.btn.edit'),
        },
        {
          type: 'danger',
          label: $t('global.btn.delete'),
        },
      ],
    },
  ],
});
// 表格数据
const list = reactive([]);

//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.menu.menuName'),
    name: 'menuName',
    type: 'input',
  },
  {
    label: $t('global.menu.menuCode'),
    name: 'menuCode',
    type: 'input',
  },
  {
    label: $t('global.menu.parentId'),
    name: 'parentId',
    type: 'tree',
    treeConfig: {
      checkStrictly: true,
      options: [],
    },
  },
  {
    label: $t('global.menu.menuType'),
    name: 'menuType',
    type: 'select',
    options: [
      {
        value: 1,
        label: $t('global.menu.package'),
      },
      {
        value: 2,
        label: $t('global.menu.munu'),
      },
      {
        value: 3,
        label: $t('global.menu.button'),
      },
    ],
  },
  {
    label: $t('global.menu.iconUrl'),
    name: 'iconUrl',
    type: 'input',
    append: {
      label: $t('global.menu.copyIcon'),
      filter: () => {
        window.open('https://icones.js.org/');
      },
    },
  },
  {
    label: $t('global.menu.sort'),
    name: 'sort',
    type: 'number',
  },
  {
    label: $t('global.menu.linkUrl'),
    name: 'path',
    type: 'input',
  },
  {
    label: $t('global.menu.componentPath'),
    name: 'componentPath',
    type: 'input',
  },
  {
    label: $t('global.menu.isShow'),
    name: 'isShow',
    type: 'radio',
    options: [
      {
        label: '是',
        value: 1,
      },
      {
        label: '否',
        value: 0,
      },
    ],
  },
]);
// 弹窗表单校验规则
const editRules = reactive({
  menuName: [
    {
      required: true,
      message: $t('global.menu.menuName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  menuCode: [
    {
      required: true,
      message: $t('global.menu.menuCode') + $t('global.required'),
      trigger: 'blur',
    },
  ],
  menuType: [
    {
      required: true,
      message: $t('global.menu.menuType') + $t('global.required'),
      trigger: 'change',
    },
  ],
  // parentId: [
  //   {
  //     required: false,
  //     message: $t('global.menu.parentId') + $t('global.required'),
  //     trigger: 'change',
  //   },
  // ],
});

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    case $t('global.btn.delete'): {
      handleDelete(row);

      break;
    }
    case $t('global.btn.edit'): {
      formTitle.value = label;
      formInfo.value = { ...row }; // 确保是新的对象引用
      itemVisible.value = true;

      break;
    }
    case $t('global.btn.linkTo'): {
      router.push(row.path);

      break;
    }
    // No default
  }
};

// 关闭弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

// 确定
const confirmDialog = async (title: string, data: any) => {
  console.log('title', title);
  console.log('data', data);
  try {
    const res =
      title === $t('global.btn.add')
        ? await addMenuApi(data)
        : await editMenuApi(data);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      // getMenuList();
      window.location.reload();
      // itemVisible.value = false;
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

// 刷新
const handleRefresh = () => {
  getMenuList();
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
      const res = await deleteMenuApi([String(row.id)]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getMenuList();
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

// 接口数据转换为树形结构
const convertToTreeStructure = (originalData: any[]) => {
  return originalData.map((item) => {
    const node = {
      value: item.id,
      label: item.menuName,
    };

    if (item.children && item.children.length > 0) {
      node.children = convertToTreeStructure(item.children);
    }

    return node;
  });
};

// 获取菜单列表
const getMenuList = async (form: any = undefined) => {
  const obj = {
    ...form,
  };
  try {
    isLoading.value = true;
    const res = await getMenuListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...res.data); // 添加新数据
      editConfig.forEach((item) => {
        if (item.name === 'parentId') {
          item.treeConfig.options = convertToTreeStructure(res.data);
        }
      });
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
  getMenuList();
});
</script>

<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <div class="button-group">
        <el-button type="success" :icon="Refresh" @click="handleRefresh">
          {{ $t('global.btn.refresh') }}
        </el-button>
        <el-button type="success" :icon="Plus" @click="handleAdd">
          {{ $t('global.btn.add') }}
        </el-button>
      </div>
    </el-card>
    <el-card class="table-box mgt5">
      <!-- 表格 -->
      <Table
        :is-tree="true"
        :pagination="false"
        :table-config="tableConfig"
        :list="list"
        @handle-click="handleClick"
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
    />
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
