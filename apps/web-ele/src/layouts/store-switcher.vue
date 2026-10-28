<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElMessage, ElOption, ElSelect } from 'element-plus';

import { switchStoreApi } from '#/api/core/user';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

const userStore = useUserStore();
const authStore = useAuthStore();
const switching = ref(false);

const ownedStores = computed(() => {
  const list = userStore.userInfo?.ownedStores;
  return Array.isArray(list) ? list : [];
});

const showSwitcher = computed(() => {
  return (
    Number(userStore.userInfo?.identityType) === 2 &&
    ownedStores.value.length > 1
  );
});

const currentStoreId = computed(() => {
  const id = userStore.userInfo?.lastStoreId;
  return id == null || id === '' ? '' : String(id);
});

const currentExpired = computed(() => {
  const current = currentStoreId.value;
  if (!current) {
    return false;
  }
  return ownedStores.value.some(
    (item) => String(item.storeId) === current && item.expired,
  );
});

onMounted(() => {
  if (Number(userStore.userInfo?.identityType) === 2) {
    void authStore.fetchUserInfo();
  }
});

function storeLabel(store: {
  expired?: boolean;
  storeName?: string;
}) {
  const name = store.storeName || $t('global.store.currentStore');
  return store.expired ? `${name}（${$t('global.store.expiredTag')}）` : name;
}

async function onChange(storeId: string) {
  if (!storeId || storeId === currentStoreId.value || switching.value) {
    return;
  }
  switching.value = true;
  try {
    await switchStoreApi({ lastStoreId: storeId });
    ElMessage.success($t('global.store.switchSuccess'));
    window.location.reload();
  } catch {
    switching.value = false;
  }
}
</script>

<template>
  <div
    v-if="showSwitcher"
    class="mr-3 flex h-full max-w-[280px] items-center gap-2"
  >
    <ElSelect
      :model-value="currentStoreId"
      :disabled="switching"
      size="small"
      filterable
      :placeholder="$t('global.store.currentStore')"
      @change="onChange"
    >
      <ElOption
        v-for="store in ownedStores"
        :key="String(store.storeId)"
        :label="storeLabel(store)"
        :value="String(store.storeId)"
      />
    </ElSelect>
    <span v-if="currentExpired" class="whitespace-nowrap text-xs text-orange-500">
      {{ $t('global.store.expiredTag') }}
    </span>
  </div>
</template>
