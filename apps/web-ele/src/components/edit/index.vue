<template>
  <el-dialog
    v-model="props.visible"
    :title="props.title"
    top="10%"
    width="750px"
    :append-to-body="true"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      label-width="80px"
      :rules="props.formRules"
    >
      <el-row :gutter="20">
        <template v-for="(item, index) in props.formConfig" :key="index">
          <!-- 每行显示两个表单项 -->
          <el-col :span="item.span ? item.span : 12">
            <el-form-item :label="item.label" :prop="item.name">
              <!--输入框-->
              <el-input
                v-if="item.type === 'input'"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseEnter')}${item.label}`"
                v-model="formData[item.name]"
              ></el-input>
              <!--数字输入框-->
              <el-input-number
                v-if="item.type === 'number'"
                v-model="formData[item.name]"
                :min="item.min ? item.min : 0"
                :max="item.max ? item.max : 999"
                :readonly="item.readonly ? item.readonly : false"
              />

              <!--文本域-->
              <el-input
                v-if="item.type === 'textarea'"
                type="textarea"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseEnter')}${item.label}`"
                v-model="formData[item.name]"
              ></el-input>
              <!--日期选择器-->
              <el-date-picker
                v-if="item.type === 'date'"
                type="date"
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`"
                :disabled="item.readonly"
                v-model="formData[item.name]"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
              ></el-date-picker>
              <!--下拉框-->
              <el-select
                v-if="item.type === 'select'"
                v-model="formData[item.name]"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`"
                style="width: 100%"
              >
                <el-option
                  v-for="(itemSelect, indexSelect) in item.options"
                  :label="itemSelect.label"
                  :value="itemSelect.value"
                  :key="indexSelect"
                ></el-option>
              </el-select>
              <!-- 树形下拉框 -->
              <el-tree-select
                v-if="item.type === 'tree'"
                v-model="formData[item.name]"
                :data="item.treeConfig.options"
                :render-after-expand="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>
    <slot name="slot"></slot>
    <!-- 底部按钮 -->
    <div class="bottom-item">
      <div class="button">
        <div class="cancel">
          <el-button @click="closeDialog">取消</el-button>
        </div>
        <div class="confirm">
          <el-button type="primary" plain @click="confirm">确定</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { $t } from '#/locales';
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
ElSelect
} from 'element-plus';
import { defineEmits, defineProps, nextTick, reactive, ref, watch } from 'vue';
const props = defineProps({
  //是否展示弹窗
  visible: {
    type: Boolean,
    default: false,
  },
  //弹窗标题
  title: {
    type: String,
    default: '',
  },
  //表单配置
  formConfig: {
    type: Array,
    default: () => [],
  },
  //表单校验
  formRules: {
    type: Object,
    default: () => ({}),
  },
  //表单数据
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

<style lang="scss" scoped>
.bottom-item {
  width: 100%;
  margin-top: 20px;
  .button {
    margin: 0 auto;
    display: flex;
    justify-content: center;
  }
  .cancel {
    margin-right: 10px;
  }
  .confirm {
    margin-left: 10px;
    .el-button--primary {
      background: #2278e9 !important;
      border-color: #2278e9 !important;
      color: #fff;
    }
    .el-button--primary:hover {
      background: #1890ff !important;
      border-color: #1890ff !important;
    }
  }
}
</style>
