import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 系统首页 / 关于我们
 * 走前端 accessRoutes，登录后仍会触发菜单/权限生成；不依赖后端动态菜单配置
 */
const routes: RouteRecordRaw[] = [
  {
    name: 'DashboardIndex',
    path: '/dashboard/index',
    component: () => import('#/views/dashboard/index.vue'),
    meta: {
      affixTab: true,
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.home'),
    },
  },
  {
    name: 'DashboardAbout',
    path: '/dashboard/about',
    component: () => import('#/views/dashboard/about.vue'),
    meta: {
      affixTab: false,
      icon: 'lucide:info',
      // 动态菜单未带 meta.order 时默认按 999 排；这里必须大于 999 才会落到侧栏最底部
      order: 9999,
      title: $t('page.dashboard.about'),
    },
  },
];

export default routes;
