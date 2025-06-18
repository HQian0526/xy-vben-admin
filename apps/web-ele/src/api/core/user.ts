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
