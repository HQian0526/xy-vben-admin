# 人员选择穿梭框组件

## 组件概述

这是一个基于 Element Plus 的穿梭框（Transfer）组件，用于在对话框中选择多个用户。组件支持：

- 左右面板展示所有人员和已选人员
- 搜索过滤功能
- 多选操作
- 返回选中用户的详细信息

## 功能特性

✅ 用户列表展示  
✅ 支持按用户名搜索过滤  
✅ 多选操作  
✅ 返回选中用户的 userName 和 realName  
✅ 响应式布局适配不同屏幕

## 使用方式

### 1. 引入组件

```vue
<script setup>
import PeopleSelector from '@/components/PeopleSelector.vue';
</script>
2. 基本用法 vue 复制
<template>
  <PeopleSelector
    :visible="dialogVisible"
    @close="dialogVisible = false"
    @confirm="handleConfirm"
  />
</template>

<script setup>
const dialogVisible = ref(false);
const handleConfirm = (selectedUsers) => {
  console.log('选中的用户:', selectedUsers);
  // 输出示例：
  // [
  //   { userName: 'zhangsan', realName: '张三' },
  //   { userName: 'lisi', realName: '李四' }
  // ]
};
</script>
Props 参数 参数名 类型 默认值 说明 visible Boolean false 控制对话框显示/隐藏
Events 事件 事件名 回调参数 说明 close - 关闭对话框时触发 confirm
Array<{userName: string, realName: string}> 点击确定时触发，返回选中用户数组
样式定制 组件支持通过以下 CSS 变量进行样式定制： scss 复制 .transfer-wrapper {
--panel-width: 45%; // 左右面板宽度 --buttons-width: 10%; // 按钮区域宽度 }
```
