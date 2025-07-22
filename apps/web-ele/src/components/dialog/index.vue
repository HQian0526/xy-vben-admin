<script lang="ts" setup>
import { defineEmits, defineProps, watch } from 'vue';

const props = defineProps({
  // 是否展示弹窗
  visible: {
    type: Boolean,
    default: false,
  },
  // 弹窗标题
  title: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  // 关闭弹窗
  (e: 'close'): void;
  // 确认提交
  (e: 'confirm', data: any): void;
}>();

// 关闭弹窗
const closeDialog = async () => {
  emit('close');
};

// 确定
const confirmDialog = async () => {
  emit('confirm', {});
};

// 监听formConfig变化
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      // 初始化数据
    }
  },
  { immediate: true },
);
</script>

<template>
  <el-dialog
    v-model="props.visible"
    :title="props.title"
    :before-close="closeDialog"
    top="10%"
    width="750px"
    :append-to-body="true"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <slot></slot>
    <!-- 底部按钮 -->
    <div class="bottom-item">
      <div class="button">
        <div class="cancel">
          <el-button @click="closeDialog">取消</el-button>
        </div>
        <div class="confirm">
          <el-button type="primary" plain @click="confirmDialog">
            确定
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
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
