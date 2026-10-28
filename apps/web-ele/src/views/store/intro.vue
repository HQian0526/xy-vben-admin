<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';

import { getStoreListApi, updateStoreIntroApi } from '#/api';
import { $t } from '#/locales';
import { currentMerchantStoreId, resolveFileUrl, toRelativeFilePath } from '#/utils';

const PHONE_REG = /^[0-9+\-]{5,20}$/;

const userStore = useUserStore();
const accessStore = useAccessStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const loading = ref(false);
const saving = ref(false);
const loaded = ref(false);
const storeDict = reactive<Array<{ label: string; value: string }>>([]);
const avatarList = ref<any[]>([]);

const form = reactive({
  id: '',
  storeId: '',
  storeName: '',
  avatar: '',
  intro: '',
  contactPhone: '',
  activityNotice: '',
  showHours: 1,
  showActivity: 1,
  showContact: 1,
  showOtherBusiness: 1,
});

const uploadHeaders = computed(() => ({
  Authorization: accessStore.accessToken
    ? `Bearer ${accessStore.accessToken}`
    : '',
}));

const canSave = computed(
  () => loaded.value && !!String(form.storeName || '').trim(),
);

function flagValue(value: any) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  return Number(value) === 1 ? 1 : 0;
}

function resetForm() {
  form.id = '';
  form.storeName = '';
  form.avatar = '';
  form.intro = '';
  form.contactPhone = '';
  form.activityNotice = '';
  form.showHours = 1;
  form.showActivity = 1;
  form.showContact = 1;
  form.showOtherBusiness = 1;
  avatarList.value = [];
  loaded.value = false;
}

function applyStore(store: any) {
  form.id = store?.id != null ? String(store.id) : '';
  form.storeId = store?.storeId != null ? String(store.storeId) : form.storeId;
  form.storeName = store?.storeName || '';
  form.avatar = toRelativeFilePath(store?.avatar || '');
  form.intro = store?.intro || '';
  form.contactPhone = store?.contactPhone || '';
  form.activityNotice = store?.activityNotice || '';
  form.showHours = flagValue(store?.showHours);
  form.showActivity = flagValue(store?.showActivity);
  form.showContact = flagValue(store?.showContact);
  form.showOtherBusiness = flagValue(store?.showOtherBusiness);
  avatarList.value = form.avatar
    ? [
        {
          name: form.avatar.split('/').pop(),
          url: resolveFileUrl(form.avatar),
          path: form.avatar,
          status: 'success',
        },
      ]
    : [];
  loaded.value = true;
}

const loadStores = async () => {
  const res = await getStoreListApi({ pageNum: 1, pageSize: 9999, deleted: 0 });
  if (res.code === 200) {
    storeDict.splice(
      0,
      storeDict.length,
      ...(res.data?.list || []).map((item: any) => ({
        label: item.storeName,
        value: String(item.storeId),
      })),
    );
  }
};

const loadStore = async (params: Record<string, any>) => {
  loading.value = true;
  try {
    const res = await getStoreListApi({
      ...params,
      deleted: 0,
      pageNum: 1,
      pageSize: 1,
    });
    if (res.code === 200) {
      const row = (res.data?.list || [])[0];
      if (row) {
        applyStore(row);
      } else {
        resetForm();
        ElMessage.warning($t('global.storeIntro.noStore'));
      }
    } else {
      resetForm();
      ElMessage.error(res.msg || $t('global.message.searchError'));
    }
  } catch (error) {
    console.log(error);
    resetForm();
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  const storeName = String(form.storeName || '').trim();
  if (!storeName) {
    ElMessage.warning(
      $t('global.pleaseEnter') + $t('global.storeIntro.name'),
    );
    return;
  }
  const phone = String(form.contactPhone || '')
    .replaceAll(/\s+/g, '')
    .trim();
  if (phone && !PHONE_REG.test(phone)) {
    ElMessage.warning($t('global.storeIntro.phoneInvalid'));
    return;
  }
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      storeName,
      avatar: form.avatar || '',
      intro: String(form.intro || '').trim(),
      contactPhone: phone,
      activityNotice: String(form.activityNotice || '').trim(),
      showHours: form.showHours,
      showActivity: form.showActivity,
      showContact: form.showContact,
      showOtherBusiness: form.showOtherBusiness,
    };
    if (isAdmin.value) {
      payload.storeId = form.storeId;
    }
    const res = await updateStoreIntroApi(payload);
    if (res.code === 200) {
      ElMessage.success($t('global.message.saveSuccess'));
      if (res.data) {
        applyStore(res.data);
      }
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error) {
    console.log(error);
  } finally {
    saving.value = false;
  }
};

const beforeUploadImg: UploadProps['beforeUpload'] = (file) => {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
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

const handleSuccessImg: UploadProps['onSuccess'] = (response: any, file) => {
  if (response?.code === 200 && response.data) {
    const path = toRelativeFilePath(response.data);
    form.avatar = path;
    file.path = path;
    file.url = resolveFileUrl(path);
    ElMessage.success($t('global.file.uploadSuccess'));
    return;
  }
  avatarList.value = [];
  form.avatar = '';
  ElMessage.error(response?.msg || $t('global.file.uploadError'));
};

const handleRemoveImg = () => {
  form.avatar = '';
  avatarList.value = [];
};

watch(
  () => form.storeId,
  (value, oldValue) => {
    if (!isAdmin.value || value === oldValue) {
      return;
    }
    if (!value) {
      resetForm();
      return;
    }
    loadStore({ storeId: value });
  },
);

onMounted(async () => {
  if (isAdmin.value) {
    await loadStores();
    return;
  }
  const storeId = currentMerchantStoreId(userStore.userInfo);
  if (storeId) {
    await loadStore({ storeId });
    return;
  }
  const userId = userStore.userInfo?.id;
  if (!userId) {
    ElMessage.error($t('global.storeIntro.noStore'));
    return;
  }
  await loadStore({ userId });
});
</script>

<template>
  <div v-loading="loading" class="pd5 intro-page">
    <el-card class="intro-card">
      <el-alert
        :title="$t('global.storeIntro.tip')"
        type="info"
        :closable="false"
        class="mb16"
      />
      <el-form label-width="108px" class="intro-form" @submit.prevent>
        <el-form-item
          v-if="isAdmin"
          :label="$t('global.storeIntro.storeName')"
          required
        >
          <el-select
            v-model="form.storeId"
            filterable
            clearable
            class="w-full"
            :placeholder="
              $t('global.pleaseSelect') + $t('global.storeIntro.storeName')
            "
          >
            <el-option
              v-for="item in storeDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <template v-if="loaded">
          <el-form-item :label="$t('global.storeIntro.avatar')">
            <el-upload
              v-model:file-list="avatarList"
              class="avatar-uploader"
              :class="{ hide: avatarList.length >= 1 }"
              action="/api/file/upload"
              :headers="uploadHeaders"
              list-type="picture-card"
              :limit="1"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              :before-upload="beforeUploadImg"
              :on-success="handleSuccessImg"
              :on-remove="handleRemoveImg"
            >
              <span class="upload-plus">+</span>
            </el-upload>
          </el-form-item>

          <el-form-item :label="$t('global.storeIntro.name')" required>
            <el-input
              v-model="form.storeName"
              maxlength="64"
              show-word-limit
              :placeholder="
                $t('global.pleaseEnter') + $t('global.storeIntro.name')
              "
            />
          </el-form-item>

          <el-form-item :label="$t('global.storeIntro.intro')">
            <el-input
              v-model="form.intro"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              :placeholder="$t('global.storeIntro.introPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('global.storeIntro.contactPhone')">
            <el-input
              v-model="form.contactPhone"
              maxlength="20"
              :placeholder="$t('global.storeIntro.contactPhonePlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('global.storeIntro.activityNotice')">
            <el-input
              v-model="form.activityNotice"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              :placeholder="$t('global.storeIntro.activityNoticePlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('global.storeIntro.showModules')">
            <div class="switch-grid">
              <div class="switch-item">
                <span>{{ $t('global.storeIntro.showHours') }}</span>
                <el-switch
                  v-model="form.showHours"
                  :active-value="1"
                  :inactive-value="0"
                />
              </div>
              <div class="switch-item">
                <span>{{ $t('global.storeIntro.showActivity') }}</span>
                <el-switch
                  v-model="form.showActivity"
                  :active-value="1"
                  :inactive-value="0"
                />
              </div>
              <div class="switch-item">
                <span>{{ $t('global.storeIntro.showContact') }}</span>
                <el-switch
                  v-model="form.showContact"
                  :active-value="1"
                  :inactive-value="0"
                />
              </div>
              <div class="switch-item">
                <span>{{ $t('global.storeIntro.showOtherBusiness') }}</span>
                <el-switch
                  v-model="form.showOtherBusiness"
                  :active-value="1"
                  :inactive-value="0"
                />
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="saving"
              :disabled="!canSave"
              @click="handleSave"
            >
              {{ $t('global.btn.save') }}
            </el-button>
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.intro-page {
  min-height: 0;
}

.intro-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  overflow: hidden;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 24px !important;
  }
}

.intro-form {
  max-width: 720px;
}

.mb16 {
  margin-bottom: 16px;
}

.w-full {
  width: 100%;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  width: 100%;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.upload-plus {
  font-size: 28px;
  color: var(--el-text-color-placeholder);
}

.avatar-uploader.hide {
  :deep(.el-upload--picture-card) {
    display: none;
  }
}
</style>
