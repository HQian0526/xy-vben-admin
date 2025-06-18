
import { requestClient } from '#/api/request';

/**
 * 获取角色列表
 */
export async function getRoleListApi(param: any) {
  return requestClient.get('/role/findRole', {
    params: param,
  });
}
