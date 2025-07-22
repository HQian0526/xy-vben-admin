<script lang="ts" setup>
import { defineEmits, defineProps, nextTick, reactive, ref, watch } from 'vue';

import {
  ElButton,
  ElCol,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';

import { $t } from '#/locales';

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
  // 表单配置
  formConfig: {
    type: Array,
    default: () => [],
  },
  // 表单校验
  formRules: {
    type: Object,
    default: () => ({}),
  },
  // 表单数据
  formInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits<{
  // 关闭弹窗
  (e: 'close'): void;
  // 确认提交
  (e: 'confirm', title: string, formData: any): void;
}>();

const formRef = ref<InstanceType<typeof ElForm>>(); // 表单引用
const formData = reactive<Record<string, any>>({}); // 表单数据
// 初始化数据
const initData = () => {
  console.log('初始化表单数据', props.formInfo);
  // 创建一个新的空对象
  const newFormData = {};
  // 遍历 formConfig 初始化所有字段
  props.formConfig.forEach((item) => {
    newFormData[item.name] = props.formInfo[item.name] || null;
  });
  newFormData.id = props.formInfo.id || '';
  // 替换整个 formData 对象
  Object.keys(formData).forEach((key) => delete formData[key]);
  Object.assign(formData, newFormData);
  console.log('formData', formData);
};

// 清除form缓存
const clearFormData = async () => {
  await nextTick();
  if (formRef.value) {
    formRef.value.clearValidate();
    formRef.value.resetFields();
  }
};

// 关闭弹窗
const closeDialog = async () => {
  await clearFormData();
  emit('close');
};

// 确定
const confirm = async () => {
  try {
    const valid = await formRef.value.validate();
    if (valid) {
      emit('confirm', props.title, formData);
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 初始化表单数据
const initFormData = () => {
  nextTick(async () => {
    await clearFormData();
    initData();
  });
};

watch(
  () => [props.visible, props.formInfo],
  ([visible, formInfo]) => {
    console.log('visible change', visible);
    if (visible) {
      initFormData();
    }
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <ElDialog
    v-model="props.visible"
    :title="props.title"
    top="10%"
    width="750px"
    :append-to-body="true"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      label-width="80px"
      :rules="props.formRules"
    >
      <ElRow :gutter="20">
        <template v-for="(item, index) in props.formConfig" :key="index">
          <!-- 每行显示两个表单项 -->
          <ElCol :span="item.span ? item.span : 12">
            <ElFormItem :label="item.label" :prop="item.name">
              <!--输入框-->
              <ElInput
                v-if="item.type === 'input'"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseEnter')}${item.label}`"
                v-model="formData[item.name]"
              />
              <!--数字输入框-->
              <el-input-number
                v-if="item.type === 'number'"
                v-model="formData[item.name]"
                :min="item.min ? item.min : 0"
                :max="item.max ? item.max : 999"
                :readonly="item.readonly ? item.readonly : false"
              />

              <!--文本域-->
              <ElInput
                v-if="item.type === 'textarea'"
                type="textarea"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseEnter')}${item.label}`"
                v-model="formData[item.name]"
              />
              <!--日期选择器-->
              <ElDatePicker
                v-if="item.type === 'date'"
                type="date"
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`"
                :disabled="item.readonly"
                v-model="formData[item.name]"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
              />
              <!--下拉框-->
              <ElSelect
                v-if="item.type === 'select'"
                v-model="formData[item.name]"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`"
                style="width: 100%"
              >
                <ElOption
                  v-for="(itemSelect, indexSelect) in item.options"
                  :label="itemSelect.label"
                  :value="itemSelect.value"
                  :key="indexSelect"
                />
              </ElSelect>
              <!-- 树形下拉框 -->
              <el-tree-select
                v-if="item.type === 'tree'"
                v-model="formData[item.name]"
                :data="item.treeConfig.options"
                :render-after-expand="false"
                :check-strictly="
                  item.treeConfig.checkStrictly
                    ? item.treeConfig.checkStrictly
                    : false
                "
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
        </template>
      </ElRow>
    </ElForm>
    <slot name="slot"></slot>
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
