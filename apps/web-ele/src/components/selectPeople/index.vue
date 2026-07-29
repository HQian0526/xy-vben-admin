<script lang="ts" setup>
import { defineEmits, defineProps, ref, watch } from 'vue';

import { ElButton, ElDialog, ElMessage, ElTransfer } from 'element-plus';

import { getUserListApi } from '#/api';
import { $t } from '#/locales';

const props = defineProps({
  // 是否展示弹窗
  visible: {
    type: Boolean,
    default: false,
  },
  // 选中的用户
  selectedUsers: {
    type: Array,
    default: () => [],
  },
  // 单选/多选 true多选 false单选
  selectMore: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  // 关闭弹窗
  (e: 'close'): void;
  // 确认提交
  (
    e: 'confirm',
    users: Array<{ id: String; realName: string; userName: string }>,
  ): void;
}>();

interface Option {
  key: string;
  label: string;
  userName: string;
}

// 统一 key 类型，避免 number/string 不一致导致已选无法回显
const normalizeKey = (id: any) => {
  if (id === null || id === undefined || id === '') return '';
  return String(id);
};

const generateData = async () => {
  const data: Option[] = [];
  try {
    const res = await getUserListApi({
      deleted: 0,
      pageNum: 1,
      pageSize: 10_000,
    });
    if (res.code === 200) {
      const states = res.data.list.map((item: any) => {
        return {
          id: item.id,
          realName: item.realName,
          userName: item.userName,
        };
      });
      states.forEach((item: any) => {
        data.push({
          label: item.realName,
          key: normalizeKey(item.id),
          userName: item.userName,
        });
      });
    } else {
      ElMessage({
        type: 'error',
        message: $t('global.message.searchError'),
      });
    }
  } catch (error) {
    console.log(error);
  }
  return data;
};

const data = ref<Option[]>([]);
const value = ref<string[]>([]);

const filterMethod = (query: string, item: Option) => {
  return item.userName?.toLowerCase?.().includes(query.toLowerCase());
};

// 根据 props.selectedUsers 回填右侧已选
const applySelectedUsers = () => {
  if (!data.value?.length || !props.selectedUsers?.length) {
    value.value = [];
    return;
  }
  const selectedKeys = props.selectedUsers
    .map((item: any) => normalizeKey(item.userId ?? item.id))
    .filter(Boolean);
  // 只保留仍存在于用户列表中的 key，保证穿梭框能正确展示
  const dataKeySet = new Set(data.value.map((item) => item.key));
  value.value = selectedKeys.filter((key) => dataKeySet.has(key));
  console.log('已选中的用户：', value.value);
};

// 关闭弹窗
const closeDialog = async () => {
  value.value = []; // 重置选择
  emit('close');
};

// 确定
const confirm = async () => {
  if (!props.selectMore && value.value && value.value.length > 1) {
    return ElMessage({
      type: 'warning',
      message: $t('global.message.onlyOneUser'),
    });
  }
  // 获取选中的用户信息
  const selectedUsers = data.value
    .filter((item) => value.value.includes(item.key))
    .map((item) => ({
      userId: item.key,
      userName: item.userName, // 对应原始数据中的userName
      realName: item.label, // 对应原始数据中的realName
    }));

  emit('confirm', selectedUsers);
};

// 打开弹窗时加载用户列表并回填已选
watch(
  () => props.visible,
  async (val) => {
    if (!val) return;
    data.value = await generateData();
    applySelectedUsers();
  },
);

// 已选用户异步到达时（弹窗已打开）再次回填，避免被覆盖成空
watch(
  () => props.selectedUsers,
  () => {
    if (props.visible) {
      applySelectedUsers();
    }
  },
  { deep: true },
);
</script>

<template>
  <ElDialog
    v-model="props.visible"
    :title="$t('global.choosePeople')"
    :before-close="closeDialog"
    top="10%"
    width="750px"
    :append-to-body="true"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <!-- 选人穿梭框 -->
    <div class="transfer-wrapper">
      <ElTransfer
        v-model="value"
        filterable
        :filter-method="filterMethod"
        :filter-placeholder="$t('global.choosePeople')"
        :data="data"
        :titles="[$t('global.allPeople'), $t('global.choicePeople')]"
        style="width: 100%"
      />
    </div>
    <!-- 底部按钮 -->
    <div class="bottom-item">
      <div class="button">
        <div class="cancel">
          <ElButton @click="closeDialog">取消</ElButton>
        </div>
        <div class="confirm">
          <ElButton type="primary" plain @click="confirm">确定</ElButton>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>
.transfer-wrapper {
  width: 100%;
  padding: 0 10px; // 左右留白

  :deep(.el-transfer) {
    display: flex;
    justify-content: space-between;

    .el-transfer-panel {
      width: 45%;
    }

    .el-transfer__buttons {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 10%;
      padding: 0 10px;

      .el-button {
        display: block;
        margin: 0 auto 10px;
      }
    }
  }
}

.bottom-item {
  width: 100%;
  margin-top: 20px;

  .button {
    display: flex;
    justify-content: center;
    margin: 0 auto;
  }

  .cancel {
    margin-right: 10px;
  }

  .confirm {
    margin-left: 10px;

    .el-button--primary {
      color: #fff;
      background: #2278e9 !important;
      border-color: #2278e9 !important;
    }

    .el-button--primary:hover {
      background: #1890ff !important;
      border-color: #1890ff !important;
    }
  }
}
</style>
