<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { defineEmits, defineProps, nextTick, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Close, Check } from '@element-plus/icons-vue';

import SelectPeople from '#/components/selectPeople/index.vue';
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
  // 表单左侧文字宽度
  labelWidth: {
    type: String,
    default: '',
  },
  // 确认按钮
  confirmText: {
    type: String,
    default: $t('global.btn.confirm'),
  },
});

const emit = defineEmits<{
  // 关闭弹窗
  (e: 'close'): void;
  // 确认提交
  (e: 'confirm', title: string, formData: any): void;
  // 选择用户
  (e: 'selectedUser', key: string, val: any): void;
}>();

const formRef = ref<InstanceType<typeof ElForm>>(); // 表单引用
const formData = reactive<Record<string, any>>({}); // 表单数据
// 图片上传相关
const dialogImageUrl = ref(''); // 图片预览地址
const dialogVisible = ref(false); // 图片预览弹窗
const token = ref(localStorage.getItem('token')); // 从存储中获取token
// 上传配置
const uploadAction = `${import.meta.env.VITE_API_BASE}/api/file/upload`; // 根据环境变量配置

//* *************选择用户相关变量**************
const selectPeopleVisible = ref(false); // 是否展示弹窗
interface User {
  userId: any;
  userName: any;
  realName: any;
}
const selectedUsers = ref<User[]>([]); // 已选用户
const selectPeopleKey = ref(''); // 弹窗标识

// 初始化数据
const initData = () => {
  console.log('初始化表单数据', props.formInfo);
  // 创建一个新的空对象
  const newFormData: Record<string, any> = {};
  // 遍历 formConfig 初始化所有字段
  props.formConfig.forEach((item: any) => {
    // 处理上传图片回显
    if (item.type === 'uploadImg') {
      if (Array.isArray(props.formInfo[item.name])) {
        // 已经是数组格式
        newFormData[item.name] = props.formInfo[item.name].map((url: any) => ({
          url: url.startsWith('http')
            ? url
            : `${import.meta.env.VITE_API_BASE}${url}`,
          status: 'success',
          name: url.split('/').pop(),
        }));
      } else if (props.formInfo[item.name]) {
        // 字符串逗号格式
        newFormData[item.name] = props.formInfo[item.name]
          .split(',')
          .map((url: any) => ({
            url: url.startsWith('http')
              ? url
              : `${import.meta.env.VITE_API_BASE}${url}`,
            status: 'success',
            name: url.split('/').pop(),
          }));
      } else {
        newFormData[item.name] = [];
      }
    } else if (item.type === 'uploadFile') {
      // 处理文件上传字段初始化
      if (Array.isArray(props.formInfo[item.name])) {
        newFormData[item.name] = props.formInfo[item.name].map((fileInfo: any) => ({
          name: fileInfo.name || fileInfo.split('/').pop(),
          url: fileInfo.url || fileInfo,
          status: 'success',
          size: fileInfo.size || 0,
        }));
      } else if (props.formInfo[item.name]) {
        newFormData[item.name] = [{
          name: props.formInfo[item.name].split('/').pop(),
          url: props.formInfo[item.name],
          status: 'success',
          size: props.formInfo[item.name] || 0,
        }];
      } else {
        newFormData[item.name] = [];
      }
    } else {
      newFormData[item.name] = props.formInfo[item.name] ?? null;
    }
  });
  newFormData.id = props.formInfo.id || '';
  // 确保 selectedUsers 被正确赋值
  if (props.formInfo.selectedUsers) {
    newFormData.selectedUsers = props.formInfo.selectedUsers;
  }
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
  dialogImageUrl.value = '';
  emit('close');
};

// 确定
const confirm = async () => {
  try {
    const valid = await formRef.value.validate();
    if (valid) {
      // 回调返回： 标题、表单数据
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

// 删除图片
const handleRemoveImg: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log(uploadFile, uploadFiles);
};

// 删除文件
const handleRemoveFile: UploadProps['onRemove'] = (uploadFile, uploadFiles, fieldName) => {
  console.log('删除文件:', uploadFile, '字段名:', fieldName);

  // 确保字段存在且是数组
  if (!formData[fieldName] || !Array.isArray(formData[fieldName])) {
    console.warn(`字段 ${fieldName} 不存在或不是数组`);
    return;
  }

  // 查找要删除的文件索引
  const index = formData[fieldName].findIndex((item: any) => {
    // 通过 uid 或 name 匹配
    return item.uid === uploadFile.uid;
  });

  if (index !== -1) {
    formData[fieldName].splice(index, 1);
    console.log('文件删除成功，更新后的文件列表:', formData[fieldName]);
  } else {
    console.warn('未找到要删除的文件');
  }
};

// 图片预览
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url;
  dialogVisible.value = true;
};

// 图片上传前校验
const beforeUploadImg = (file) => {
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
  const isLt20M = file.size / 1024 / 1024 < 20;

  if (!isImage) {
    ElMessage.error($t('global.file.onlyImage'));
    return false;
  }
  if (!isLt20M) {
    ElMessage.error($t('global.file.limitSize'));
    return false;
  }
  return true;
};

// 文件上传前校验
const beforeUploadFile = (file) => {
  const isLt20M = file.size / 1024 / 1024 < 20;
  if (!isLt20M) {
    ElMessage.error($t('global.file.limitSize'));
    return false;
  }
  return true;
};

// 删除文件前
const beforeRemove: UploadProps['beforeRemove'] = (uploadFile, uploadFiles) => {
  // return ElMessageBox.confirm(
  //   `${$t('global.file.delete')}【${uploadFile.name}】 ?`
  // ).then(
  //   () => true,
  //   () => false
  // )
}

// 图片上传成功处理
const handleSuccessImg = (response: any, file: any, item: any) => {
  console.log('response', response);
  console.log('file', file);
  if (response.data) {
    ElMessage.success('上传成功');
    file.url = `${import.meta.env.VITE_API_BASE}/api${response.data}`; // 将返回的URL绑定到文件对象
  }
  console.log('yyyy', formData);
};

// 文件上传成功处理
const handleSuccessFile = (response: any, file: any, item: any) => {
  console.log('response', response);
  console.log('file', file);
  if (response.data) {
    ElMessage.success('上传成功');
    file.url = `${response.data.split('/upload-images')[1]}`; // 将返回的URL绑定到文件对象
    file.name = file.name || response.data.split('/').pop();
  }

  // 手动更新文件列表
  if (!formData[item.name]) {
    formData[item.name] = [];
  }

  // 检查文件是否已经在列表中
  const fileExists = formData[item.name].some((f: any) => f.uid === file.uid);
  if (!fileExists) {
    formData[item.name].push({
      name: file.name,
      url: file.url,
      status: 'success',
      uid: file.uid,
      size: file.size,
    });
  }
  console.log('yyyy', formData);
};

// 上传失败处理
const handleError = () => {
  ElMessage.error('上传失败，请重试');
};

// 文件数超出限制
const handleExceed = () => {
  ElMessage.warning($t('global.file.limitNum'));
};

// 打开选择用户弹窗
const openSelectPeopleDialog = (key: string) => {
  selectPeopleKey.value = key;
  if (formData.selectedUsers) {
    selectedUsers.value = formData.selectedUsers[key];
  }
  selectPeopleVisible.value = true;
};

// 关闭选择用户弹窗
const closeUserDialog = () => {
  selectedUsers.value = [];
  selectPeopleVisible.value = false;
};

// 确定选择用户弹窗
const confirmUserDialog = async (val: any) => {
  console.log('val', val);
  selectedUsers.value = val;
  selectPeopleVisible.value = false;
  formData[selectPeopleKey.value] = val.map((item: any) => item.realName);
  // 回调返回：字段名、已选用户
  emit('selectedUser', selectPeopleKey.value, selectedUsers.value);
};

// 手动触发校验表单
const validateForm = () => {
  console.log('触发校验方法');
  const valid = formRef.value.validate();
  return valid;
};

defineExpose({
  validateForm, // 暴露方法
});

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
  <div>
    <ElForm ref="formRef" :model="formData" :label-width="labelWidth ? labelWidth : '80px'" :rules="props.formRules">
      <ElRow :gutter="20">
        <template v-for="(item, index) in props.formConfig" :key="index">
          <!-- 每行显示两个表单项 -->
          <ElCol v-if="item.name" :span="item.span ? item.span : 12">
            <ElFormItem :label="item.label" :prop="item.name">
              <!--输入框-->
              <ElInput v-if="item.type === 'input'" :readonly="item.readonly ? item.readonly : false"
                :placeholder="item.placeholder ? item.placeholder : `${$t('global.pleaseEnter')}${item.label}`"
                v-model="formData[item.name]">
                <template v-if="item.append" #append>
                  <div @click="item.append.filter ? item.append.filter() : null">
                    {{ item.append.label }}
                  </div>
                </template>
              </ElInput>
              <!--数字输入框-->
              <el-input-number v-if="item.type === 'number'" v-model="formData[item.name]"
                :min="item.min ? item.min : 0" :max="item.max ? item.max : 999999"
                :readonly="item.readonly ? item.readonly : false" />
              <!--文本域-->
              <ElInput v-if="item.type === 'textarea'" type="textarea" :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseEnter')}${item.label}`" v-model="formData[item.name]" />
              <!--日期选择器-->
              <ElDatePicker v-if="item.type === 'date'" type="date"
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`" :disabled="item.readonly"
                v-model="formData[item.name]" style="width: 100%" value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
              <!--下拉框-->
              <ElSelect v-if="item.type === 'select'" v-model="formData[item.name]"
                :readonly="item.readonly ? item.readonly : false"
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`" style="width: 100%">
                <ElOption v-for="(itemSelect, indexSelect) in item.options" :label="itemSelect.label"
                  :value="Number(itemSelect.value)" :key="indexSelect" />
              </ElSelect>
              <el-radio-group v-if="item.type === 'radio'" v-model="formData[item.name]">
                <el-radio v-for="(itemRadio, indexRadio) in item.options" :key="indexRadio" :value="itemRadio.value">
                  {{ itemRadio.label }}
                </el-radio>
              </el-radio-group>
              <!-- 树形下拉框 -->
              <el-tree-select v-if="item.type === 'tree'" v-model="formData[item.name]" :data="item.treeConfig.options"
                :render-after-expand="false" :check-strictly="item.treeConfig.checkStrictly
                    ? item.treeConfig.checkStrictly
                    : false
                  " style="width: 100%" />
              <!-- 选人弹窗 -->
              <ElInput v-if="item.type === 'selectPeople'" readonly
                :placeholder="`${$t('global.pleaseSelect')}${item.label}`" v-model="formData[item.name]">
                <template v-if="item.append" #append>
                  <div @click="
                    item.append.filter
                      ? item.append.filter()
                      : openSelectPeopleDialog(item.name)
                    ">
                    {{ item.append.label }}
                  </div>
                </template>
              </ElInput>
              <!-- 图片上传 -->
              <template v-if="item.type === 'uploadImg'">
                <el-upload v-model:file-list="formData[item.name]" :class="formData[item.name]?.length === item.limit ? 'hide' : ''
                  " :action="uploadAction" :headers="{ Authorization: token }" list-type="picture-card"
                  :limit="item.limit || 5" :on-preview="handlePictureCardPreview" :on-remove="handleRemoveImg"
                  :on-exceed="handleExceed" :before-upload="beforeUploadImg" @success="
                    (response, file) => handleSuccessImg(response, file, item)
                  " :on-error="handleError">
                  <el-icon>
                    <Plus />
                  </el-icon>
                </el-upload>

                <ElDialog v-model="dialogVisible">
                  <img w-full :src="dialogImageUrl" alt="Preview Image" />
                </ElDialog>
              </template>
              <!-- 文件上传 -->
              <template v-if="item.type === 'uploadFile'">
                <el-upload :file-list="formData[item.name]" class="upload-demo" :action="uploadAction"
                  :accept="item.accept" :before-remove="beforeRemove"
                  :on-remove="(uploadFilled, uploadFiles) => handleRemoveFile(uploadFilled, uploadFiles, item.name)"
                  :limit="item.limit" :on-exceed="handleExceed" :before-upload="beforeUploadFile"
                  :on-error="handleError" @success="
                    (response, file) => handleSuccessFile(response, file, item)
                  ">
                  <el-button type="primary">{{ $t('global.btn.upload') }}</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      {{ item.tip ? item.tip : $t('global.file.fileSize') }}
                    </div>
                  </template>
                </el-upload>
              </template>
            </ElFormItem>
          </ElCol>
          <template v-if="item.type === 'deliver'">
            <el-divider content-position="left">{{ `【${item.label}】` }}</el-divider>
          </template>
        </template>
      </ElRow>
    </ElForm>
    <slot name="slot"></slot>
    <!-- 底部按钮 -->
    <div class="bottom-item">
      <div class="button">
        <div class="cancel">
          <ElButton :icon="Close" @click="closeDialog">取消</ElButton>
        </div>
        <div class="confirm">
          <ElButton type="primary" :icon="Check" plain @click="confirm">
            {{ props.confirmText }}
          </ElButton>
        </div>
      </div>
    </div>
  </div>

  <!-- 选择用户弹窗 -->
  <SelectPeople :key="selectPeopleKey" :visible="selectPeopleVisible" :selected-users="selectedUsers"
    :select-more="false" @close="closeUserDialog" @confirm="confirmUserDialog" />
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
<style scoped>
::v-deep .el-input-group__append {
  cursor: pointer;
}

::v-deep .el-upload__tip {
  margin-top: 0px !important;
}

.hide {
  :deep(.el-upload--picture-card) {
    display: none;
  }
}
</style>
