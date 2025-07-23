import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { getAllMenusApi, getRoleList } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  // 使用 Vite 的 import.meta.glob 动态导入 ../views 目录下所有 Vue 组件文件
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  // 定义可用的布局组件（如 BasicLayout 用于主框架，IFrameView 用于嵌入 iframe）。
  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  // “根据角色过滤路由”以及“动态注册路由”
  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      ElMessage({
        duration: 1500,
        message: `${$t('common.loadingMenu')}...`,
      });

      // 先获取当前用户的角色id列表
      const userStore = useUserStore();
      const res = getRoleList(userStore.userInfo.id).then((res: any) => {
        if (res.code === 200) {
          // 再根据该用户的角色获取对应的菜单
          return getAllMenusApi({ roleIds: res.data.join(',') }).then(
            (res: any) => {
              return res.data;
            },
          );
        } else {
          ElMessage.error($t('global.message.getUserInfoErr'));
          return [];
        }
      });
      return res;
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
