<!-- eslint-disable no-console -->
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Back } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@vben/stores';

import {
  addContractApi,
  editContractApi,
  getContractDetailApi,
  getContractTempApi,
  getContractVarApi,
  getStoreListApi,
  initiateSignApi,
  platformSignApi,
  previewContractContentApi,
  voidContractApi,
} from '#/api';
import { $t } from '#/locales';
import { resolveFileUrl } from '#/utils';

import ContractBodyEditor from './ContractBodyEditor.vue';
import { CONTRACT_VARS, skeletonByPartyType } from './contractContent';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isAdmin = computed(
  () => Number(userStore.userInfo?.identityType) === 3,
);

const saving = ref(false);
const initiating = ref(false);
const statusLabel = ref('');
const platformSignStatus = ref(0);
const merchantSignImage = ref('');
const storeDict = reactive<Array<{ label: string; value: any }>>([]);
const filling = ref(false);
const varCatalog = ref<
  Array<{ key: string; label: string; sourceType: number; defaultValue: string }>
>([]);
const customVarValues = reactive<Record<string, string>>({});
const insertVars = computed(() =>
  varCatalog.value.length
    ? varCatalog.value.map((item) => ({ key: item.key, label: item.label }))
    : [...CONTRACT_VARS],
);
const customVars = computed(() =>
  varCatalog.value.filter((item) => Number(item.sourceType) === 2),
);
const templateDict = reactive<
  Array<{ label: string; value: any; partyType: number; content: string }>
>([]);
const form = reactive({
  contractNo: '',
  contractName: '',
  storeId: '' as string,
  templateId: '' as string,
  partyType: 1,
  startDate: '',
  endDate: '',
  totalAmount: undefined as number | undefined,
  remark: '',
  contentSnapshot: '',
  contractStatus: 0,
});

const isDraft = computed(
  () => !form.contractNo || Number(form.contractStatus) === 0,
);

const loadStores = async () => {
  const res = await getStoreListApi({ pageSize: 9999, pageNum: 1 });
  if (res.code === 200) {
    storeDict.splice(
      0,
      storeDict.length,
      ...(res.data.list || []).map((item: any) => ({
        label: item.storeName,
        value: String(item.storeId),
      })),
    );
  }
};

const loadVars = async () => {
  try {
    const res = await getContractVarApi({ pageNum: 1, pageSize: 200, status: 1 });
    if (res.code === 200 && res.data?.list?.length) {
      varCatalog.value = res.data.list.map((item: any) => ({
        key: item.varKey,
        label: item.varLabel,
        sourceType: Number(item.sourceType) || 2,
        defaultValue: item.defaultValue || '',
      }));
      syncCustomValues();
    }
  } catch {
    /* keep builtin fallback */
  }
};

const syncCustomValues = (fromJson?: string) => {
  let parsed: Record<string, any> = {};
  if (fromJson) {
    try {
      parsed = JSON.parse(fromJson) || {};
    } catch {
      parsed = {};
    }
  }
  for (const item of customVars.value) {
    const incoming = parsed[item.key];
    if (incoming != null && String(incoming) !== '') {
      customVarValues[item.key] = String(incoming);
    } else if (customVarValues[item.key] == null) {
      customVarValues[item.key] = item.defaultValue || '';
    }
  }
};

const customVariablesJson = () => {
  const payload: Record<string, string> = {};
  for (const item of customVars.value) {
    payload[item.key] = customVarValues[item.key] ?? '';
  }
  return JSON.stringify(payload);
};

const loadTemplates = async () => {
  const res = await getContractTempApi({ pageNum: 1, pageSize: 200, status: 1 });
  if (res.code === 200) {
    templateDict.splice(
      0,
      templateDict.length,
      ...(res.data.list || []).map((item: any) => ({
        label: item.templateName,
        value: String(item.id),
        partyType: Number(item.partyType) || 1,
        content: item.content || '',
      })),
    );
  }
};

const onTemplateChange = (val: string) => {
  const hit = templateDict.find((item) => item.value === val);
  if (!hit) return;
  form.partyType = hit.partyType;
  if (hit.content) {
    form.contentSnapshot = hit.content;
  }
};

const applySkeleton = () => {
  form.contentSnapshot = skeletonByPartyType(form.partyType);
};

const onPartyTypeChange = (val: number) => {
  const next = skeletonByPartyType(val);
  const prev = skeletonByPartyType(val === 2 ? 1 : 2);
  if (!form.contentSnapshot.trim() || form.contentSnapshot === prev) {
    form.contentSnapshot = next;
  }
};

const fillVariables = async () => {
  if (!form.storeId) {
    ElMessage.warning(`${$t('global.pleaseSelect')}${$t('global.contract.storeName')}`);
    return;
  }
  if (!form.contentSnapshot.trim() && !form.templateId) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.content')}`);
    return;
  }
  filling.value = true;
  try {
    const res = await previewContractContentApi({
      storeId: form.storeId,
      templateId: form.templateId || undefined,
      contentSnapshot: form.contentSnapshot,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      totalAmount: form.totalAmount,
      partyType: form.partyType,
      variablesJson: customVariablesJson(),
    });
    if (res.code === 200 && res.data?.content) {
      form.contentSnapshot = res.data.content;
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } catch (error: any) {
    if (error?.msg) ElMessage.error(error.msg);
  } finally {
    filling.value = false;
  }
};

const loadDetail = async (contractNo: string) => {
  const res = await getContractDetailApi(contractNo);
  if (res.code !== 200 || !res.data) {
    ElMessage.error(res.msg || $t('global.message.error'));
    return;
  }
  const data = res.data;
  form.contractNo = data.contractNo;
  form.contractName = data.contractName;
  form.storeId = data.storeId == null ? '' : String(data.storeId);
  form.templateId = data.templateId == null ? '' : String(data.templateId);
  form.partyType = Number(data.partyType) || 1;
  form.startDate = data.startDate ? String(data.startDate).slice(0, 10) : '';
  form.endDate = data.endDate ? String(data.endDate).slice(0, 10) : '';
  form.totalAmount = data.totalAmount;
  form.remark = data.remark || '';
  form.contentSnapshot = data.contentSnapshot || '';
  form.contractStatus = Number(data.contractStatus) || 0;
  statusLabel.value = data.statusLabel || '';
  platformSignStatus.value = Number(data.platformSignStatus) || 0;
  const merchant = (data.signers || []).find((item: any) => Number(item.partyRole) === 2);
  merchantSignImage.value = resolveFileUrl(merchant?.signImageUrl);
};

const buildPayload = () => ({
  contractNo: form.contractNo || undefined,
  contractName: form.contractName,
  storeId: form.storeId,
  templateId: form.templateId || undefined,
  partyType: form.partyType,
  startDate: form.startDate || undefined,
  endDate: form.endDate || undefined,
  totalAmount: form.totalAmount,
  remark: form.remark,
  contentSnapshot: form.contentSnapshot,
  variablesJson: customVariablesJson(),
});

const saveDraft = async () => {
  if (!form.contractName) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.contractName')}`);
    return false;
  }
  if (!form.storeId) {
    ElMessage.warning(`${$t('global.pleaseSelect')}${$t('global.contract.storeName')}`);
    return false;
  }
  if (!form.templateId && !form.contentSnapshot.trim()) {
    ElMessage.warning(`${$t('global.pleaseEnter')}${$t('global.contract.content')}`);
    return false;
  }
  saving.value = true;
  try {
    const api = form.contractNo ? editContractApi : addContractApi;
    const res = await api(buildPayload());
    if (res.code === 200) {
      ElMessage.success($t('global.message.success'));
      const no = res.data?.contractNo || form.contractNo;
      if (no) {
        await loadDetail(no);
      }
      return true;
    }
    ElMessage.error(res.msg || $t('global.message.error'));
    return false;
  } catch (error: any) {
    if (error?.msg) ElMessage.error(error.msg);
    return false;
  } finally {
    saving.value = false;
  }
};

const saveAndInitiate = async () => {
  initiating.value = true;
  try {
    const ok = await saveDraft();
    if (!ok || !form.contractNo) return;
    const res = await initiateSignApi(form.contractNo);
    if (res.code === 200) {
      ElMessage.success(res.data?.message || $t('global.message.success'));
      await loadDetail(form.contractNo);
    } else {
      ElMessage.error(res.msg || $t('global.message.error'));
    }
  } finally {
    initiating.value = false;
  }
};

const handlePlatformSign = async () => {
  const res = await platformSignApi(form.contractNo);
  if (res.code === 200) {
    ElMessage.success($t('global.message.success'));
    await loadDetail(form.contractNo);
  } else {
    ElMessage.error(res.msg || $t('global.message.error'));
  }
};

const handleVoid = () => {
  ElMessageBox.prompt('请输入作废原因（选填）', $t('global.btn.voidContract'), {
    confirmButtonText: $t('global.btn.confirm'),
    cancelButtonText: $t('global.btn.cancel'),
  })
    .then(async ({ value }) => {
      const res = await voidContractApi(form.contractNo, value);
      if (res.code === 200) {
        ElMessage.success($t('global.message.success'));
        await loadDetail(form.contractNo);
      } else {
        ElMessage.error(res.msg || $t('global.message.error'));
      }
    })
    .catch(() => {});
};

onMounted(async () => {
  await Promise.all([loadStores(), loadTemplates(), loadVars()]);
  const no = String(route.query.no || '');
  if (no) {
    await loadDetail(no);
  }
});
</script>

<template>
  <div class="pd5 contract-detail-page">
    <el-card class="detail-card">
      <div class="header">
        <el-button :icon="Back" @click="router.push('/contract-list')">
          {{ $t('global.btn.back') }}
        </el-button>
        <span class="title">
          {{
            !form.contractNo
              ? $t('global.btn.add')
              : isDraft
                ? $t('global.btn.edit')
                : $t('global.btn.detail')
          }}
        </span>
        <el-tag v-if="statusLabel" class="status-tag">{{ statusLabel }}</el-tag>
      </div>
      <el-form label-width="120px" class="mgt5" :disabled="!isDraft">
        <el-form-item :label="$t('global.contract.contractName')" required>
          <el-input v-model="form.contractName" maxlength="128" />
        </el-form-item>
        <el-form-item v-if="isAdmin" :label="$t('global.contract.storeName')" required>
          <el-select v-model="form.storeId" filterable style="width: 100%">
            <el-option
              v-for="item in storeDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.contract.templateName')">
          <el-select
            v-model="form.templateId"
            clearable
            style="width: 100%"
            :placeholder="`${$t('global.pleaseSelect')}${$t('global.contract.templateName')}`"
            @change="onTemplateChange"
          >
            <el-option
              v-for="item in templateDict"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('global.contract.partyType')">
          <el-radio-group v-model="form.partyType" @change="onPartyTypeChange">
            <el-radio :value="1">{{ $t('global.contract.person') }}</el-radio>
            <el-radio :value="2">{{ $t('global.contract.enterprise') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('global.contract.startDate')">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="$t('global.contract.endDate')">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="$t('global.contract.totalAmount')">
          <el-input-number v-model="form.totalAmount" :min="0" :precision="2" style="width: 240px" />
        </el-form-item>
        <el-form-item :label="$t('global.contract.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" />
        </el-form-item>
        <el-form-item v-if="customVars.length" :label="$t('global.contract.customVars')">
          <div class="custom-vars">
            <p class="hint">{{ $t('global.contract.customVarHint') }}</p>
            <div v-for="item in customVars" :key="item.key" class="custom-var-row">
              <span class="custom-var-label">{{ item.label }}</span>
              <el-input v-model="customVarValues[item.key]" maxlength="255" />
            </div>
          </div>
        </el-form-item>
        <el-form-item :label="$t('global.contract.content')" required>
          <div class="content-wrap">
            <p class="hint">{{ $t('global.contract.contentHint') }}</p>
            <div v-if="isDraft" class="content-actions">
              <el-button size="small" @click="applySkeleton">
                {{ $t('global.contract.applySkeleton') }}
              </el-button>
              <el-button size="small" type="primary" :loading="filling" @click="fillVariables">
                {{ $t('global.contract.fillVariables') }}
              </el-button>
            </div>
            <ContractBodyEditor
              v-model="form.contentSnapshot"
              :readonly="!isDraft"
              show-insert
              :vars="insertVars"
              :rows="18"
              :placeholder="$t('global.contract.contentPlaceholder')"
            />
            <div v-if="!isDraft" class="sign-off">
              <div class="sign-off-label">{{ $t('global.contract.partyBSign') }}</div>
              <el-image
                v-if="merchantSignImage"
                class="sign-off-img"
                :src="merchantSignImage"
                fit="contain"
                :preview-src-list="[merchantSignImage]"
              />
              <span v-else class="sign-off-empty">暂无手写签名</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <div v-if="isAdmin && isDraft" class="footer">
        <el-button :loading="saving" @click="saveDraft">{{ $t('global.btn.save') }}</el-button>
        <el-button type="primary" :loading="initiating" @click="saveAndInitiate">
          {{ $t('global.btn.initiateSign') }}
        </el-button>
      </div>
      <div v-else-if="isAdmin && form.contractStatus === 1" class="footer">
        <el-button
          v-if="platformSignStatus === 0"
          type="warning"
          @click="handlePlatformSign"
        >
          {{ $t('global.btn.platformSign') }}
        </el-button>
        <el-button type="danger" @click="handleVoid">
          {{ $t('global.btn.voidContract') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@use "#/styles/style.scss" as *;

.contract-detail-page {
  min-height: 0;
}

.detail-card {
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
  }
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.status-tag {
  margin-left: auto;
}

.content-wrap {
  width: 100%;
}

.hint {
  margin: 0 0 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.custom-vars {
  width: 100%;
}

.custom-var-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.custom-var-label {
  flex: 0 0 96px;
  color: #606266;
}

.content-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.sign-off {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color);
}

.sign-off-label {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.sign-off-img {
  width: 220px;
  height: 96px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
}

.sign-off-empty {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 20px;
}
</style>
