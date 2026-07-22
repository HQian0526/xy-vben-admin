<script lang="ts" setup>
import type { TreeInstance } from 'element-plus';

import { defineEmits, defineProps, ref } from 'vue';

const props = defineProps({
  // 树形数据
  treeData: {
    type: Array,
    default: () => [],
  },
  // 默认选中的节点（复选模式）
  defaultCheckedKeys: {
    type: Array,
    default: () => [],
  },
  // 是否展示复选框；false 时为单选（点击节点选中）
  showCheckbox: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  // 选中数据
  (e: 'selected', data: any, selected: any): void;
}>();

interface Tree {
  id: number;
  label: string;
  children?: Tree[];
}

const treeRef = ref<TreeInstance>();

// 获取当前选中/未选中的节点
const getCheckedKeys = () => {
  console.log(treeRef.value!.getCheckedKeys(false));
};

// 重置所有节点的选中状态
const resetChecked = () => {
  if (props.showCheckbox) {
    treeRef.value!.setCheckedKeys([], false);
  } else {
    treeRef.value!.setCurrentKey(undefined);
  }
};

// 当复选框被点击的时候触发
const handleCheck = (currentData: any, selectedData: any) => {
  console.log('当前', currentData);
  console.log('所有选中节点:', selectedData);
  emit('selected', currentData, selectedData);
};

// 单选模式：点击节点选中
const handleNodeClick = (currentData: any) => {
  // 复选模式下不响应节点点击，避免影响原有页面
  if (props.showCheckbox) return;
  console.log('单选当前', currentData);
  emit('selected', currentData, {
    checkedKeys: currentData?.id == null ? [] : [currentData.id],
    checkedNodes: currentData ? [currentData] : [],
  });
};

const defaultProps = {
  children: 'children',
  label: 'label',
};
</script>

<template>
  <el-tree
    ref="treeRef"
    style="max-width: 100%"
    :data="treeData"
    :show-checkbox="showCheckbox"
    default-expand-all
    :default-checked-keys="defaultCheckedKeys"
    node-key="id"
    highlight-current
    :props="defaultProps"
    @check="handleCheck"
    @node-click="handleNodeClick"
  />
</template>

<style lang="scss" scoped></style>
