import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/getUserInfo');
  // return requestClient.get<UserInfo>('/user/info');
}

/**
 * 获取用户列表
 */
export async function getUserListApi(param: any) {
  return requestClient.get('/user/findUser', {
    params: param
  });
}

/**
 * 新增
 */
export async function addUserApi(data: any) {
  return requestClient.post('/user/addUser', data);
}

/**
 * 编辑
 */
export async function editUserApi(data: any) {
  return requestClient.put('/user/editUser', data);
}

/**
 * 删除
 */
export async function deleteUserApi(data: any) {
  return requestClient.delete('/user/deleteUser', {
    data: data,
  });
}

