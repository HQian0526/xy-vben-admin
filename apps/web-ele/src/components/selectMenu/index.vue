<script lang="ts" setup>
import { defineEmits, defineProps, ref } from 'vue';

import { ElButton, ElDialog, ElTransfer } from 'element-plus';

import { $t } from '#/locales';

const props = defineProps({
  // 是否展示弹窗
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  // 关闭弹窗
  (e: 'close'): void;
  // 确认提交
  (e: 'confirm', users: Array<{ realName: string; userName: string }>): void;
}>();

interface Option {
  key: number;
  label: string;
  initial: string;
}

const generateData = () => {
  const data: Option[] = [];
  const states = [
    {
      userName: 'zhangsan',
      realName: '张三',
    },
    {
      userName: 'lisi',
      realName: '李四',
    },
    {
      userName: 'wangwu',
      realName: '王五',
    },
    {
      userName: 'zhaoliu',
      realName: '赵六',
    },
  ];
  states.forEach((item, index) => {
    data.push({
      label: item.realName,
      key: index,
      initial: item.userName,
    });
  });
  return data;
};

const data = ref<Option[]>(generateData());
const value = ref([]);

const filterMethod = (query, item) => {
  return item.initial.toLowerCase().includes(query.toLowerCase());
};

// 关闭弹窗
const closeDialog = async () => {
  emit('close');
};

// 确定
const confirm = async () => {
  // 获取选中的用户信息
  const selectedUsers = data.value
    .filter((item) => value.value.includes(item.key))
    .map((item) => ({
      userName: item.initial, // 对应原始数据中的userName
      realName: item.label, // 对应原始数据中的realName
    }));

  emit('confirm', selectedUsers);
};
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
