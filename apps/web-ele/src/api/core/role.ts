
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

/**
 * 角色权限分配
 */
export async function assignPerms(data: any) {
  return requestClient.post('/role/assignPerms', data);
}

/**
 * 角色权限分配
 */
export async function getRoleMenuTree(roleId: any) {
  return requestClient.get(`/role/menu-tree/${roleId}`);
}
