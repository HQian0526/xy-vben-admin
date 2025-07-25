<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch } from 'vue';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import logoUrl from '#/assets/logo.png';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([
  {
    avatar: 'https://avatar.vercel.sh/vercel.svg?text=VB',
    date: '3小时前',
    isRead: true,
    message: '描述信息描述信息描述信息',
    title: '收到了 14 份新周报',
  },
  {
    avatar: 'https://avatar.vercel.sh/1',
    date: '刚刚',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '朱偏右 回复了你',
  },
  {
    avatar: 'https://avatar.vercel.sh/1',
    date: '2024-01-01',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '曲丽丽 评论了你',
  },
  {
    avatar: 'https://avatar.vercel.sh/satori',
    date: '1天前',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '代办提醒',
  },
]);

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);
const getTag = computed(() => {
  if (userStore.userInfo && userStore.userInfo.identityType) {
    console.log('identity', userStore.userInfo.identityType);
    if (Number(userStore.userInfo.identityType) === 1) {
      return '基础用户';
    } else if (Number(userStore.userInfo.identityType) === 2) {
      return 'vip用户';
    } else {
      return '管理员';
    }
  } else {
    return '基础用户';
  }
});

// const menus = computed(() => [
//   {
//     handler: () => {
//       openWindow(VBEN_DOC_URL, {
//         target: '_blank',
//       });
//     },
//     icon: BookOpenText,
//     text: $t('ui.widgets.document'),
//   },
//   {
//     handler: () => {
//       openWindow(VBEN_GITHUB_URL, {
//         target: '_blank',
//       });
//     },
//     icon: MdiGithub,
//     text: 'GitHub',
//   },
//   {
//     handler: () => {
//       openWindow(`${VBEN_GITHUB_URL}/issues`, {
//         target: '_blank',
//       });
//     },
//     icon: CircleHelp,
//     text: $t('ui.widgets.qa'),
//   },
// ]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}
watch(
  () => preferences.app.watermark,
  async (enable) => {
    if (enable) {
      await updateWatermark({
        content: `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout :logo="logoUrl" @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <!-- 需要额外下拉可传:menus -->
      <UserDropdown
        :avatar
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.userName"
        :tag-text="getTag"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
