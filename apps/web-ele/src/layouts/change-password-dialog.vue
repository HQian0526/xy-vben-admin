<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

import { changePasswordApi } from '#/api';
import { $t } from '#/locales';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const hasLetter = computed(() => /[A-Za-z]/.test(form.newPassword));
const hasNumber = computed(() => /\d/.test(form.newPassword));
const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(form.newPassword));
const hasLength = computed(() => form.newPassword.length > 6);
const passedCount = computed(() => {
  if (!form.newPassword) return 0;
  return [
    hasLetter.value,
    hasNumber.value,
    hasSpecial.value,
    hasLength.value,
  ].filter(Boolean).length;
});
const strengthLevel = computed(() => {
  if (passedCount.value >= 4) return 3;
  if (passedCount.value >= 3) return 2;
  if (passedCount.value >= 1) return 1;
  return 0;
});
const strengthText = computed(() => {
  if (strengthLevel.value >= 3) return $t('global.user.passwordStrong');
  if (strengthLevel.value === 2) return $t('global.user.passwordMedium');
  if (strengthLevel.value === 1) return $t('global.user.passwordWeak');
  return '';
});
const strengthClass = computed(() => {
  if (strengthLevel.value >= 3) return 'is-strong';
  if (strengthLevel.value === 2) return 'is-medium';
  if (strengthLevel.value === 1) return 'is-weak';
  return '';
});

const validateNewPassword = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error($t('global.pleaseEnter') + $t('global.user.newPassword')));
    return;
  }
  if (value.length <= 6) {
    callback(new Error($t('global.user.passwordMinLength')));
    return;
  }
  if (!hasLetter.value || !hasNumber.value || !hasSpecial.value) {
    callback(new Error($t('global.user.passwordRuleTip')));
    return;
  }
  if (value === form.oldPassword) {
    callback(new Error($t('global.user.passwordSameAsOld')));
    return;
  }
  callback();
};

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(
      new Error($t('global.pleaseEnter') + $t('global.user.confirmPassword')),
    );
    return;
  }
  if (value !== form.newPassword) {
    callback(new Error($t('global.user.passwordMismatch')));
    return;
  }
  callback();
};

const rules = computed<FormRules>(() => ({
  oldPassword: [
    {
      required: true,
      message: $t('global.pleaseEnter') + $t('global.user.oldPassword'),
      trigger: 'blur',
    },
  ],
  newPassword: [{ validator: validateNewPassword, trigger: 'change' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}));

const resetForm = () => {
  form.oldPassword = '';
  form.newPassword = '';
  form.confirmPassword = '';
  formRef.value?.clearValidate();
};

watch(visible, (val) => {
  if (!val) {
    resetForm();
  }
});

watch(
  () => form.newPassword,
  () => {
    if (form.confirmPassword) {
      formRef.value?.validateField('confirmPassword');
    }
  },
);

const handleClose = () => {
  visible.value = false;
};

const handleConfirm = async () => {
  if (submitting.value) return;
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    const res = await changePasswordApi({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: $t('global.message.success'),
      });
      visible.value = false;
      emit('success');
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || $t('global.message.error'),
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="$t('global.btn.changePassword')"
    width="460px"
    :append-to-body="true"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item :label="$t('global.user.oldPassword')" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          autocomplete="off"
          :placeholder="$t('global.pleaseEnter') + $t('global.user.oldPassword')"
        />
      </el-form-item>
      <el-form-item :label="$t('global.user.newPassword')" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('global.pleaseEnter') + $t('global.user.newPassword')"
        />
        <div class="pwd-strength" :class="strengthClass">
          <div class="pwd-strength-head">
            <span>{{ $t('global.user.passwordStrength') }}</span>
            <span v-if="strengthText" class="pwd-strength-text">{{
              strengthText
            }}</span>
          </div>
          <div class="pwd-strength-bars">
            <i :class="{ on: strengthLevel >= 1 }" />
            <i :class="{ on: strengthLevel >= 2 }" />
            <i :class="{ on: strengthLevel >= 3 }" />
          </div>
          <ul class="pwd-strength-rules">
            <li :class="{ ok: hasLetter }">
              {{ $t('global.user.needLetter') }}
            </li>
            <li :class="{ ok: hasNumber }">
              {{ $t('global.user.needNumber') }}
            </li>
            <li :class="{ ok: hasSpecial }">
              {{ $t('global.user.needSpecial') }}
            </li>
            <li :class="{ ok: hasLength }">
              {{ $t('global.user.needLength') }}
            </li>
          </ul>
        </div>
      </el-form-item>
      <el-form-item
        :label="$t('global.user.confirmPassword')"
        prop="confirmPassword"
      >
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="
            $t('global.pleaseEnter') + $t('global.user.confirmPassword')
          "
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">{{ $t('global.btn.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        {{ $t('global.btn.confirmChange') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.pwd-strength {
  width: 100%;
  margin-top: 8px;
}

.pwd-strength-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.pwd-strength-text {
  font-weight: 600;
}

.pwd-strength.is-weak .pwd-strength-text {
  color: var(--el-color-danger);
}

.pwd-strength.is-medium .pwd-strength-text {
  color: var(--el-color-warning);
}

.pwd-strength.is-strong .pwd-strength-text {
  color: var(--el-color-success);
}

.pwd-strength-bars {
  display: flex;
  gap: 6px;
}

.pwd-strength-bars i {
  flex: 1;
  height: 6px;
  background: var(--el-fill-color);
  border-radius: 3px;
}

.pwd-strength.is-weak .pwd-strength-bars i.on {
  background: var(--el-color-danger);
}

.pwd-strength.is-medium .pwd-strength-bars i.on {
  background: var(--el-color-warning);
}

.pwd-strength.is-strong .pwd-strength-bars i.on {
  background: var(--el-color-success);
}

.pwd-strength-rules {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
}

.pwd-strength-rules li::before {
  content: '○ ';
}

.pwd-strength-rules li.ok {
  color: var(--el-color-success);
}

.pwd-strength-rules li.ok::before {
  content: '● ';
}
</style>
