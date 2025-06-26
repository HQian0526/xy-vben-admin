
import { requestClient } from '#/api/request';

/**
 * 获取角色列表
 */
export async function getRoleListApi(param: any) {
  return requestClient.get('/role/findRole', {
    params: param,
  });
}

/**
 * 新增角色
 */
export async function addRoleApi(data: any) {
  return requestClient.post('/role/addRole', data);
}

/**
 * 编辑角色
 */
export async function editRoleApi(data: any) {
  return requestClient.put('/role/updateRole', data);
}

/**
 * 删除角色
 */
export async function deleteRoleApi(data: any) {
  return requestClient.delete('/role/deleteRole', {
    data: data,
  });
}
