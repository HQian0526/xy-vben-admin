<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addRoleApi,
  assignPerms,
  assignRoles,
  deleteRoleApi,
  editRoleApi,
  getMenuListApi,
  getRoleListApi,
  getRoleMenuTree,
  getUsersByRoleId,
} from '#/api';
import Dialog from '#/components/dialog/index.vue';
import Edit from '#/components/edit/index.vue';
import Filter from '#/components/filter/index.vue';
import SelectPeople from '#/components/selectPeople/index.vue';
import Table from '#/components/table/index.vue';
import AuthTree from '#/components/tree/index.vue';
import { $t } from '#/locales';

const isLoading = ref(false);
const devideUserId = ref(null);
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
      prop: 'roleName',
      label: $t('global.role.roleName'),
    },
    {
      prop: 'remark',
      label: $t('global.role.remark'),
    },
    {
      prop: 'operation',
      label: $t('global.operation'),
      fixed: 'right',
      width: '400px',
      operations: [
        {
          type: 'primary',
          label: $t('global.btn.edit'),
          isShow: () => true,
        },
        {
          type: 'primary',
          label: $t('global.btn.devideUser'),
          isShow: () => true,
        },
        {
          type: 'primary',
          label: $t('global.btn.devideAuth'),
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
      prop: 'roleName',
      label: $t('global.role.roleName'),
      value: '',
      placeholder: `${$t('global.pleaseEnter')}${$t('global.role.roleName')}`,
    },
  ],
});

//* *************edit相关变量**************
const itemVisible = ref(false); // 是否展示弹窗
const formTitle = ref(''); // 弹窗标题
const formInfo = ref({}); // 弹窗其他信息
// 弹窗表单校验规则
const editRules = reactive({
  roleName: [
    {
      required: true,
      message: $t('global.role.roleName') + $t('global.required'),
      trigger: 'blur',
    },
  ],
});
// 弹窗表单配置
const editConfig = reactive([
  {
    label: $t('global.role.roleName'),
    name: 'roleName',
    type: 'input',
    readonly: false,
    span: 24,
  },
  {
    label: $t('global.role.remark'),
    name: 'remark',
    type: 'textarea',
    readonly: false,
    span: 24,
  },
]);

//* *************分配用户相关变量**************
const userVisible = ref(false); // 是否展示弹窗
const selectedUsers = ref([]); // 已选用户

//* *************分配权限相关变量**************
const authVisible = ref(false); // 是否展示弹窗
const treeData = ref([]); // 权限树形结构数据
const roleId = ref(null); // 角色id
const menuIds = ref([]); // 已选菜单id
// 点击展开收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const search = (form: any) => {
  console.log('form', form);
  getRoleList(form);
};

const reset = (form: any) => {
  console.log('form', form);
  formConfig.list.forEach((item) => {
    item.value = null;
  });
  getRoleList(form);
};

// 点击操作列按钮
const handleClick = (row: any, label: string) => {
  console.log('row', row);
  console.log('label', label);
  switch (label) {
    case $t('global.btn.delete'): {
      // 删除
      handleDelete(row);

      break;
    }
    case $t('global.btn.devideAuth'): {
      // 分配权限
      console.log('devideAuth');
      roleId.value = row.id;
      getRoleMenuChecked(row.id);

      break;
    }
    case $t('global.btn.devideUser'): {
      // 分配用户
      console.log('devideUser', JSON.parse(row.userList));
      devideUserId.value = row.id;
      getUserListByRoleId(row.id);

      break;
    }
    case $t('global.btn.edit'): {
      // 编辑
      formTitle.value = label;
      formInfo.value = { ...row }; // 确保是新的对象引用
      itemVisible.value = true;

      break;
    }
    // No default
  }
};

// 表格分页
const handleCurrentChange = (currentPage: number) => {
  console.log('currentPage', currentPage);
  pageInfo.pageNum = currentPage;
  getRoleList();
};

// 表格分页大小
const handleSizeChange = (pageSize: number) => {
  console.log('pageSize', pageSize);
  pageInfo.pageSize = pageSize;
  getRoleList();
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
        ? await addRoleApi(data)
        : await editRoleApi(data);
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      getRoleList();
      itemVisible.value = false;
    } else {
      ElMessage({
        type: 'error',
        message: res.msg,
      });
    }
  } catch {}
};

// 关闭分配用户弹窗
const closeUserDialog = () => {
  selectedUsers.value = [];
  userVisible.value = false;
};

// 确定分配用户弹窗
const confirmUserDialog = async (val: any) => {
  console.log('val', val);
  try {
    const res = await assignRoles({
      roleId: devideUserId.value,
      userIds: val.map((item: any) => item.userId),
    });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      userVisible.value = false;
      getRoleList();
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
      const res = await deleteRoleApi([row.id]);
      console.log('res', res);
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: $t('global.message.success'),
        });
        getRoleList();
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

// 获取角色列表
const getRoleList = async (form: any = undefined) => {
  const obj = {
    ...form,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  };
  try {
    isLoading.value = true;
    const res = await getRoleListApi(obj);
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

// 关闭分配权限弹窗
const closeAuthDialog = () => {
  authVisible.value = false;
};

// 确定分配权限弹窗
const confirmAuthDialog = async () => {
  const obj = {
    roleId: roleId.value,
    menuIds: menuIds.value,
  };
  try {
    isLoading.value = true;
    const res = await assignPerms(obj);
    if (res.code === 200) {
      isLoading.value = false;
      ElMessage({
        type: 'success',
        message: res.msg,
      });
      authVisible.value = false;
    } else {
      isLoading.value = false;
      ElMessage({
        type: 'error',
        message: res.msg,
      });
    }
  } catch (error) {
    isLoading.value = false;
    console.log(error);
  }
};

// 获取选中权限
const authSelected = (currentData: any, selectedData: any) => {
  menuIds.value = []; // 清空数组但保持响应性
  menuIds.value.push(...selectedData.checkedKeys); // 添加新数据
};

// 获取菜单列表
const getMenuList = async () => {
  try {
    const res = await getMenuListApi();
    if (res.code === 200) {
      treeData.value = convertToTreeStructure(res.data);
    } else {
      ElMessage({
        type: 'error',
        message: $t('global.message.getMenuError'),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// 接口数据转换为树形结构
const convertToTreeStructure = (originalData: any[]) => {
  return originalData.map((item) => {
    const node = {
      id: item.id,
      label: item.menuName,
    };

    if (item.children && item.children.length > 0) {
      node.children = convertToTreeStructure(item.children);
    }

    return node;
  });
};

// 递归获取所有checked为true的ID数组
const getCheckedIds = (treeData) => {
  let checkedIds = [];

  treeData.forEach((node) => {
    if (node.checked) {
      checkedIds.push(node.id);
    }

    if (node.children && node.children.length > 0) {
      checkedIds = checkedIds.concat(getCheckedIds(node.children));
    }
  });

  return checkedIds;
};

// 获取角色已选权限
const getRoleMenuChecked = async (roleId: number) => {
  try {
    isLoading.value = true;
    const res = await getRoleMenuTree(roleId);
    if (res.code === 200) {
      menuIds.value = getCheckedIds(res.data);
      isLoading.value = false;
      authVisible.value = true;
    } else {
      isLoading.value = false;
      ElMessage({
        type: 'error',
        message: $t('global.message.getMenuError'),
      });
    }
  } catch (error) {
    isLoading.value = false;
    console.log(error);
  }
};

// 获取角色对应的用户列表
const getUserListByRoleId = async (roleId: number) => {
  try {
    selectedUsers.value = [];
    const res = await getUsersByRoleId(roleId);
    if (res.code === 200) {
      selectedUsers.value = res.data;
      userVisible.value = true;
    } else {
      userVisible.value = false;
      ElMessage({
        type: 'error',
        message: $t('global.message.getUserInfoErr'),
      });
    }
  } catch (error) {
    userVisible.value = false;
    console.log(error);
  }
};

onMounted(() => {
  getRoleList(); // 获取角色列表
  getMenuList(); // 获取菜单列表
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
            <el-button type="success" @click="handleAdd">
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
      :form-config="editConfig"
      :form-rules="editRules"
      :title="formTitle"
      :form-info="formInfo"
      :visible="itemVisible"
      @close="closeDialog"
      @confirm="confirmDialog"
    />
    <!-- 分配用户弹窗 -->
    <SelectPeople
      :visible="userVisible"
      :selected-users="selectedUsers"
      @close="closeUserDialog"
      @confirm="confirmUserDialog"
    />
    <!-- 分配权限弹窗 -->
    <Dialog
      :visible="authVisible"
      :title="$t('global.devideAuth')"
      @close="closeAuthDialog"
      @confirm="confirmAuthDialog"
    >
      <AuthTree
        :tree-data="treeData"
        :default-checked-keys="menuIds"
        @selected="authSelected"
      />
    </Dialog>
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
