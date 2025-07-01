<template>
  <div v-loading="isLoading" class="pd5">
    <el-card>
      <div class="button-group">
        <el-button type="success" @click="handleAdd">{{
          $t('global.btn.add')
        }}</el-button>
      </div>
    </el-card>
    <el-card class="table-box mgt5">
      <!-- 表格 -->
      <Table
        :is-tree="true"
        :pagination="false"
        :table-config="tableConfig"
        :list="list"
        @handleClick="handleClick"
      ></Table>
    </el-card>
    <!-- 弹窗 -->
    <Edit
      ref="editForm"
      :formConfig="editConfig"
      :formRules="editRules"
      :title="formTitle"
      :formInfo="formInfo"
      :visible="itemVisible"
      @close="closeDialog"
      @confirm="confirmDialog"
    ></Edit>
  </div>
</template>

<script lang="ts" setup>
import { addMenuApi, deleteMenuApi, editMenuApi, getMenuListApi } from '#/api';
import Edit from '#/components/edit/index.vue';
import Table from '#/components/table/index.vue';
import { $t } from '#/locales';
import { onMounted, reactive, ref } from 'vue';
const isLoading = ref(false);
//**************table相关变量**************
// 表格配置
const tableConfig = reactive({
  list: [
    {
      prop: 'index',
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
      prop: 'linkUrl',
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
let list = reactive([
  {
    id: 1,
    menuName: '系统管理',
    menuCode: 'system_manage',
    menuType: 1,
    sort: 1,
    linkUrl: '',
  },
  {
    id: 2,
    menuName: '系统管理',
    menuCode: 'system_manage',
    menuType: 1,
    sort: 2,
    linkUrl: '',
  },
  {
    id: 3,
    menuName: '系统管理',
    menuCode: 'system_manage',
    menuType: 1,
    sort: 3,
    linkUrl: '',
    children: [
      {
        id: 31,
        menuName: '用户管理',
        menuCode: 'system_manage',
        menuType: 2,
        sort: 1,
        linkUrl: 'www.baidu.com',
      },
      {
        id: 31,
        menuName: '角色管理',
        menuCode: 'system_manage',
        menuType: 2,
        sort: 1,
        linkUrl: 'www.baidu.com',
      },
    ],
  },
]);

//**************edit相关变量**************
let itemVisible = ref(false); //是否展示弹窗
let formTitle = ref(''); //弹窗标题
let formInfo = ref({}); //弹窗其他信息
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
      options: [
        {
          value: '1',
          label: 'Level one 1',
          children: [
            {
              value: '1-1',
              label: 'Level two 1-1',
              children: [
                {
                  value: '1-1-1',
                  label: 'Level three 1-1-1',
                },
              ],
            },
          ],
        },
        {
          value: '2',
          label: 'Level one 2',
          children: [
            {
              value: '2-1',
              label: 'Level two 2-1',
              children: [
                {
                  value: '2-1-1',
                  label: 'Level three 2-1-1',
                },
              ],
            },
            {
              value: '2-2',
              label: 'Level two 2-2',
              children: [
                {
                  value: '2-2-1',
                  label: 'Level three 2-2-1',
                },
              ],
            },
          ],
        },
      ],
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
  },
  {
    label: $t('global.menu.sort'),
    name: 'sort',
    type: 'number',
  },
  {
    label: $t('global.menu.linkUrl'),
    name: 'linkUrl',
    type: 'input',
  },
  {
    label: $t('global.menu.componentPath'),
    name: 'componentPath',
    type: 'input',
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
  parentId: [
    {
      required: true,
      message: $t('global.menu.parentId') + $t('global.required'),
      trigger: 'change',
    },
  ],
});

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  if (label === $t('global.btn.edit')) {
    formTitle.value = label;
    formInfo.value = { ...row }; // 确保是新的对象引用
    itemVisible.value = true;
  } else if (label === $t('global.btn.delete')) {
    handleDelete(row);
  }
};

//关闭弹窗
const closeDialog = () => {
  itemVisible.value = false;
};

//确定
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
      getMenuList();
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
    ElMessageBox.confirm($t('global.message.confirmLock'), $t('global.tip'), {
      confirmButtonText: $t('global.btn.confirm'),
      cancelButtonText: $t('global.btn.cancel'),
      type: 'warning',
    }).then(async () => {
      const res = await deleteMenuApi([row.id]);
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
  } catch (err) {
    console.log(err);
  }
};

// 获取菜单列表
const getMenuList = async (form: any = undefined) => {
  let obj = {
    ...form,
  };
  try {
    isLoading.value = true;
    const res = await getMenuListApi(obj);
    if (res.code === 200) {
      // 正确的方式：先清空数组再添加新数据
      list.length = 0; // 清空数组但保持响应性
      list.push(...res.data); // 添加新数据
      isLoading.value = false;
    } else {
      isLoading.value = false;
      ElMessage({
        type: 'error',
        message: $t('global.message.searchError'),
      });
    }
  } catch (err) {
    isLoading.value = false;
    console.log(err);
  }
};

onMounted(() => {
  getMenuList();
});
</script>

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
