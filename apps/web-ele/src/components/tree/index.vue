<script lang="ts" setup>
import type { TreeInstance } from 'element-plus';

import { defineEmits, defineProps, ref } from 'vue';

const props = defineProps({
  // 树形数据
  treeData: {
    type: Array,
    default: () => [],
  },
  // 默认选中的节点
  defaultCheckedKeys: {
    type: Array,
    default: () => [],
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
  treeRef.value!.setCheckedKeys([], false);
};

// 当复选框被点击的时候触发
const handleCheck = (currentData: any, selectedData: any) => {
  console.log('当前', currentData);
  console.log('所有选中节点:', selectedData);
  emit('selected', currentData, selectedData);
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
    show-checkbox
    default-expand-all
    :default-checked-keys="defaultCheckedKeys"
    node-key="id"
    highlight-current
    :props="defaultProps"
    @check="handleCheck"
  />
</template>

<style lang="scss" scoped></style>
