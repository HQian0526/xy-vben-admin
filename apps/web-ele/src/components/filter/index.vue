<script lang="ts" setup>
import { Refresh, Search } from '@element-plus/icons-vue';
import {
ElButton,
ElCheckbox,
ElCheckboxGroup,
ElDatePicker,
ElForm,
ElFormItem,
ElInput,
ElOption,
ElRadio,
ElRadioGroup,
ElSelect
} from 'element-plus';
import { defineEmits, defineProps, onMounted, reactive, ref, watch } from 'vue';

import { $t } from '#/locales';

// 添加表单引用

const props = defineProps({
  formConfig: {
    type: Object,
    default: () => ({
      list: [] as Array<{
        clearable: boolean;
        label: string;
        placeholder: string;
        prop: string;
        type: string;
        value: any;
      }>,
    }),
  },
});
const emit = defineEmits<{
  (e: 'search', obj: Record<string, any>): void;
  (e: 'reset', obj: Record<string, any>): void;
}>();
const form = reactive({});
const formRef = ref();
const search = () => {
  emit('search', form);
};

const reset = async () => {
  props.formConfig.list.forEach((item: any) => {
    if (item.prop) {
      form[item.prop] = undefined;
    }
  });
  emit('reset', form);
};

// 将formConfig中的值同步到form对象
const initFormData = () => {
  props.formConfig.list.forEach((item: any) => {
    if (item.prop) {
      form[item.prop] = item.value ? item.value : undefined;
    }
  });
};

// 初始化方法改为在 onMounted 中执行
onMounted(() => {
  initFormData();
});

// 监听formConfig变化（如果父组件可能动态改变formConfig）
watch(() => props.formConfig.list, initFormData, { deep: true });
</script>

<template>
  <ElForm
    ref="formRef"
    :inline="true"
    :model="form"
    class="demo-form-inline"
    @submit.prevent
  >
    <ElFormItem
      v-for="(item, index) in formConfig.list"
      :key="index"
      :label="item.label"
    >
      <!-- input输入框 -->
      <ElInput
        v-if="item.type === 'input'"
        v-model="form[item.prop]"
        :placeholder="item.placeholder"
        :clearable="item.clearable || true"
        @keyup.enter.native="search"
      />
      <!-- select下拉框 -->
      <ElSelect
        v-if="item.type === 'select'"
        v-model="form[item.prop]"
        :placeholder="item.placeholder"
        :clearable="item.clearable || true"
      >
        <ElOption
          v-for="(it, ind) in item.options"
          :key="ind"
          :label="it.label"
          :value="it.value"
        />
      </ElSelect>
      <!-- date-picker日期选择器 -->
      <ElDatePicker
        v-if="item.type === 'date'"
        v-model="form[item.prop]"
        type="date"
        :placeholder="item.placeholder"
        :clearable="item.clearable || true"
      />
      <!-- checkbox-group多选框 -->
      <ElCheckboxGroup
        v-if="item.type === 'checkbox'"
        v-model="form[item.prop]"
      >
        <ElCheckbox
          v-for="(it, ind) in item.options"
          :key="ind"
          :value="it.value"
          name="type"
        >
          {{ it.value }}
        </ElCheckbox>
      </ElCheckboxGroup>
      <!-- radio-group单选框 -->
      <ElRadioGroup v-if="item.type === 'radio'" v-model="form[item.prop]">
        <ElRadio v-for="(it, ind) in item.options" :key="ind" :value="it.value">
          {{ it.value }}
        </ElRadio>
      </ElRadioGroup>
    </ElFormItem>
    <ElFormItem v-if="formConfig.showBtn ? formConfig.showBtn : true">
      <ElButton type="primary" :icon="Search" @click="search">
        {{ $t('global.btn.search') }}
      </ElButton>
      <ElButton type="primary" :icon="Refresh" @click="reset">
        {{ $t('global.btn.reset') }}
      </ElButton>
      <slot name="extra"></slot>
    </ElFormItem>
  </ElForm>
</template>

<style>
.demo-form-inline {
  height: 32px;
}

.demo-form-inline .el-input {
  --el-input-width: 160px;
}

.demo-form-inline .el-select {
  --el-select-width: 160px;
}
</style>
