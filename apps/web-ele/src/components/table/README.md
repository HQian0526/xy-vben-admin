## 功能概述

基于 Element Plus 的表格组件封装，提供以下核心功能：

- 多种列类型支持（普通列、索引列、字典列、操作列）
- 分页功能（可配置开启/关闭）
- 操作按钮自定义
- 字典值自动转换
- 响应式布局

## 安装与使用

### 基础用法

```vue
<template>
  <CommonTable
    :tableConfig="tableConfig"
    :list="tableData"
    :total="total"
    @handleClick="handleOperation"
    @handleCurrentChange="handlePageChange"
    @handleSizeChange="handleSizeChange"
  />
</template>

<script setup>
import CommonTable from '#/components/CommonTable.vue';

// 表格配置
const tableConfig = {
  list: [
    { prop: 'index', label: '序号' },
    { prop: 'name', label: '姓名', width: '150' },
    {
      prop: 'status',
      label: '状态',
      dict: [
        { key: 1, value: '启用' },
        { key: 0, value: '禁用' },
      ],
    },
    {
      prop: 'operation',
      label: '操作',
      operations: [
        { label: '编辑', type: 'primary', show: true },
        { label: '删除', type: 'danger', show: true },
      ],
    },
  ],
  pagination: true,
};

// 表格数据
const tableData = ref([
  { id: 1, name: '张三', status: 1 },
  { id: 2, name: '李四', status: 0 },
]);

// 总条数
const total = ref(100);

// 操作按钮事件
const handleOperation = (row, operationName) => {
  console.log('操作行:', row);
  console.log('操作名称:', operationName);
};

// 分页事件处理
const handlePageChange = (currentPage) => {
  console.log('当前页码:', currentPage);
};
const handleSizeChange = (pageSize) => {
  console.log('每页条数:', pageSize);
};
</script>
```
