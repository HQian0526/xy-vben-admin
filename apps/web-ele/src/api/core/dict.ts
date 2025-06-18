import { requestClient } from '#/api/request';

/**
 * 获取角色列表
 */
export async function getDictListApi(param: any) {
  return requestClient.get('/dict/findDict', {
    params: param,
  });
}
