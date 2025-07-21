import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi(param: any) {
  // return requestClient.get<RouteRecordStringComponent[]>('/menu/all');
  return requestClient.get<RouteRecordStringComponent[]>('/menu/getMenuRoute', {
    params: param,
  });
}

/**
 * 查询
 */
export async function getMenuListApi(param: any) {
  return requestClient.get('/menu/findMenu', {
    params: param,
  });
}

/**
 * 新增
 */
export async function addMenuApi(data: any) {
  return requestClient.post('/menu/addMenu', data);
}

/**
 * 编辑
 */
export async function editMenuApi(data: any) {
  return requestClient.put('/menu/updateMenu', data);
}

/**
 * 删除
 */
export async function deleteMenuApi(data: any) {
  return requestClient.delete('/menu/deleteMenu', {
    data: data,
  });
}

export interface Menu {
  id?: number;
  name: string;
  menuCode: string;
  parentId?: number | null;
  nodeType: number; // 1-文件夹 2-页面 3-按钮
  iconUrl?: string;
  sort: number;
  linkUrl?: string;
  level?: number;
  path?: string;
  isDelete?: number;
}

export interface MenuTree extends Menu {
  children?: MenuTree[];
}
