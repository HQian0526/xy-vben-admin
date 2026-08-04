<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

import logoUrl from '#/assets/logo.png';
import { $t } from '#/locales';

const appName = computed(() => preferences.app.name);
// const logo = computed(() => preferences.logo.source);
const logo = logoUrl;

// 登录页底部版权：公司名 + ICP备案号（与系统首页一致）
const copyrightInfo = {
  companyName: '广州市星萤网络有限公司',
  date: String(new Date().getFullYear()),
  enable: true,
  icp: '粤ICP备2024284312号',
  icpLink: 'https://beian.miit.gov.cn/',
};
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
  >
    <!-- 自定义底部版权，避免 preferences 本地缓存导致 ICP 不生效 -->
    <template #copyright>
      <div class="text-md flex-center">
        Copyright © {{ copyrightInfo.date }}
        <span class="mx-1">{{ copyrightInfo.companyName }}</span>
        <a
          class="hover:text-primary-hover mx-1"
          :href="copyrightInfo.icpLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ copyrightInfo.icp }}
        </a>
      </div>
    </template>
  </AuthPageLayout>
</template>
