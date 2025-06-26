<template>
  <el-form ref="formRef" :inline="true" :model="form" class="demo-form-inline" @submit.prevent>
    <el-form-item
      v-for="(item, index) in formConfig.list"
      :key="index"
      :label="item.label"
    >
      <!-- input输入框 -->
      <el-input
        v-if="item.type === 'input'"
        v-model="form[item.prop]"
        :placeholder="item.placeholder"
        :clearable="item.clearable || true"
        @keyup.enter.native="search"
      />
      <!-- select下拉框 -->
      <el-select
        v-if="item.type === 'select'"
        v-model="form[item.prop]"
        :placeholder="item.placeholder"
        :clearable="item.clearable || true"
      >
        <el-option
          v-for="(it, ind) in item.options"
          :key="ind"
          :label="it.label"
          :value="it.value"
        ></el-option>
      </el-select>
      <!-- date-picker日期选择器 -->
      <el-date-picker
        v-if="item.type === 'date'"
        v-model="form[item.prop]"
        type="date"
        :placeholder="item.placeholder"
        :clearable="item.clearable || true"
      />
      <!-- checkbox-group多选框 -->
      <el-checkbox-group
        v-if="item.type === 'checkbox'"
        v-model="form[item.prop]"
      >
        <el-checkbox
          v-for="(it, ind) in item.options"
          :key="ind"
          :value="it.value"
          name="type"
        >
          {{ it.value }}
        </el-checkbox>
      </el-checkbox-group>
      <!-- radio-group单选框 -->
      <el-radio-group v-if="item.type === 'radio'" v-model="form[item.prop]">
        <el-radio
          v-for="(it, ind) in item.options"
          :key="ind"
          :value="it.value"
          >{{ it.value }}</el-radio
        >
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="formConfig.showBtn ? formConfig.showBtn : true">
      <el-button type="primary" @click="search">{{
        $t('global.btn.search')
      }}</el-button>
      <el-button type="primary" @click="reset">{{
        $t('global.btn.reset')
      }}</el-button>
      <slot name="extra"></slot>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { $t } from '#/locales';
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

let form = reactive({});
const formRef = ref(); // 添加表单引用

const props = defineProps({
  formConfig: {
    type: Object,
    default: () => ({
      list: [] as Array<{
        type: string;
        prop: string;
        label: string;
        value: any;
        placeholder: string;
        clearable: boolean;
      }>,
    }),
  },
});

const emit = defineEmits<{
  (e: 'search', obj: Record<string, any>): void;
  (e: 'reset', obj: Record<string, any>): void;
}>();

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
