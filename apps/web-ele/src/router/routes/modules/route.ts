import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'pajamas:admin',
      order: 9999,
      title: $t('route.system-manage'),
    },
    name: 'SystemManagement',
    path: '/system',
    children: [
      // 用户管理
      {
        name: 'UserManagement',
        path: '/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'pajamas:account',
          title: $t('route.user-manage'),
        },
      },
      // 角色管理
      {
        name: 'RoleManagement',
        path: '/role',
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          icon: 'pajamas:assignee',
          title: $t('route.role-manage'),
        },
      },
      // 菜单管理
      {
        name: 'MenuManagement',
        path: '/menu',
        component: () => import('#/views/system/menu/index.vue'),
        meta: {
          icon: 'pajamas:issue-type-requirements',
          title: $t('route.menu-manage'),
        },
      },
      // 字典管理
      {
        name: 'DictManagement',
        path: '/dict',
        component: () => import('#/views/system/dict/index.vue'),
        meta: {
          icon: 'pajamas:diagram',
          title: $t('route.dictionary-manage'),
        },
      },
    ],
  },
];

export default routes;
