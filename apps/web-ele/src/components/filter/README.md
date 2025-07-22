头部搜索组件 (Filter) 这是一个基于 Vue 3 + TypeScript + Element Plus 的 ​动态表单搜索组件，适用于后台管理系统的头部搜索区域。组件支持多种表单控件类型，包括输入框、下拉框和日期选择器，并可通过配置快速生成搜索表单。

📦 功能特性 ​动态表单配置​：通过 formConfig 动态生成表单控件 ​多种控件类型​：支持 input、select、date 三种表单类型 ​国际化支持​：按钮文本使用 $t 国际化 ​插槽扩展​：提供 extra 插槽用于添加自定义内容 ​响应式布局​：表单采用 inline 布局，适配不同屏幕宽度

🛠 使用方法

1.  基本使用 <template> <Filter :form-data="searchForm" @submit="handleSubmit" @reset="handleReset"
    >
        <template #extra>
          <el-button type="success">导出数据</el-button>
        </template>
      </Filter>
    </template>

<script setup>
import { ref } from 'vue';
import Filter from '@/components/filter/index.vue';

// 表单配置
const searchForm = ref({
  formConfig: [
    {
      type: 'input',
      label: '订单编号',
      value: '',
      placeholder: '请输入订单编号'
    },
    {
      type: 'select',
      label: '订单状态',
      value: '',
      options: [
        { label: '全部', value: '' },
        { label: '待付款', value: 1 },
        { label: '已付款', value: 2 }
      ]
    },
    {
      type: 'date',
      label: '创建日期',
      value: ''
    }
  ],
  showBtn: true
});

// 处理搜索事件
const handleSubmit = (formConfig) => {
  console.log('搜索条件:', formConfig);
  // 这里添加实际搜索逻辑
};

// 处理重置事件
const handleReset = () => {
  console.log('表单已重置');
  // 这里添加重置后的逻辑
};
</script>

2. 配置参数 (formData) 参数 类型 必填 默认值 说明 formConfig Array 是 [] 表单配置数组 showBtn Boolean 否 true 是否显示搜索/重置按钮表单项配置 (formConfig 数组项) 属性 类型 必填 说明 type 'input'｜'select'｜'date' 是 控件类型 label string 是 表单项标签 value any 是 绑定值 placeholder string 否 占位文本 clearable boolean 否 true options Array<{label:string,value:any}> 当type为select时必填
3. 事件事件名 说明 参数 @submit 点击搜索按钮时触发 - @reset 点击重置按钮时触发 -
4. 插槽名称 说明 extra 在按钮区域添加自定义内容 🎨 样式定制组件内置了基础样式，可通过以下 CSS 变量覆盖默认样式：

🔧 开发建议 ​数据绑定​：建议使用 v-model 或 Pinia 管理表单数据 ​表单验证​：可扩展添加 rules 属性支持动态验证规则 ​更多控件​：可根据需求扩展 checkbox/radio 等控件类型
