# 对话框表单组件

一个基于 Vue 3 和 Element Plus 的可复用对话框表单组件。

## 功能特性

- 基于配置动态生成表单
- 支持多种表单字段类型
- 默认每行显示两个字段的响应式布局
- 内置表单验证功能
- 可自定义对话框外观
- 支持国际化

## 组件属性

| 属性名     | 类型    | 默认值 | 说明                |
| ---------- | ------- | ------ | ------------------- |
| visible    | Boolean | false  | 控制对话框显示/隐藏 |
| title      | String  | ''     | 对话框标题          |
| formConfig | Array   | []     | 表单字段配置数组    |
| formRules  | Object  | {}     | 表单验证规则        |
| formInfo   | Object  | {}     | 表单初始数据        |

## 表单配置说明

`formConfig` 属性接收一个包含字段配置对象的数组，每个对象可包含以下属性：

```javascript
{
  type: 'input', // 字段类型(input/textarea/date/select)
  label: '字段标签', // 显示标签
  name: 'fieldName', // 字段标识(用于v-model)
  span: 12, // 栅格宽度(默认12即半宽)
  readonly: false, // 是否只读
  options: [ // 下拉选项(select类型必需)
    { label: '选项1', value: 1 },
    { label: '选项2', value: 2 }
  ]
}
事件说明
事件名	参数	说明
close	-	对话框关闭时触发
confirm	(title, formData)	表单提交时触发
使用示例
vue
复制
<template>
  <DialogForm
    :visible="dialogVisible"
    :title="'用户信息'"
    :form-config="formConfig"
    :form-rules="formRules"
    :form-info="formData"
    @close="handleClose"
    @confirm="handleConfirm"
  />
</template>

<script setup>
const formConfig = [
  {
    type: 'input',
    label: '用户名',
    name: 'username',
    span: 12
  },
  {
    type: 'select',
    label: '性别',
    name: 'gender',
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' }
    ]
  }
];

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ]
};
</script>
样式定制
组件包含基础的布局和按钮样式，可以通过以下类名进行覆盖：

.bottom-item - 底部按钮容器
.button - 按钮组容器
.cancel - 取消按钮容器
.confirm - 确认按钮容器
```
