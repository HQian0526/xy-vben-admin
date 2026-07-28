import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 系统首页静态路由
 * 走前端 accessRoutes，登录后仍会触发菜单/权限生成；不依赖后端动态菜单配置
 */
const routes: RouteRecordRaw[] = [
  {
    name: 'DashboardIndex',
    path: '/dashboard/index',
    component: () => import('#/views/dashboard/index.vue'),
    meta: {
      affixTab: true,
      icon: 'lucide:home',
      order: -1,
      title: $t('page.dashboard.home'),
    },
  },
];

export default routes;
