<script lang="ts" setup>
import { ElSwitch } from 'element-plus';

import { $t } from '#/locales';

import { useOrderAlert } from './use-order-alert';

const { enabled, isMerchant, onToggle } = useOrderAlert();
</script>

<template>
  <div
    v-if="isMerchant"
    class="mr-3 flex h-full items-center gap-2 whitespace-nowrap text-sm"
  >
    <ElSwitch v-model="enabled" size="small" @change="onToggle" />
    <span>{{ $t('global.order.alertToggle') }}</span>
  </div>
</template>

<style>
.xy-order-alert-notice {
  cursor: pointer;
}

.xy-order-alert-go-view {
  color: var(--el-color-primary);
  font-size: 13px;
}
</style>
