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
    data,
  });
}

/**
 * 角色权限分配
 */
export async function assignPerms(data: any) {
  return requestClient.post('/role/assignPerms', data);
}

/**
 * 获取角色对应菜单
 */
export async function getRoleMenuTree(roleId: any) {
  return requestClient.get(`/role/menu-tree/${roleId}`);
}

/**
 * 获取用户对应权限列表
 */
export async function getRoleList(userId: any) {
  return requestClient.get(`/role/getRoleList/${userId}`);
}

/**
 * 用户分配角色
 */
export async function assignRoles(data: any) {
  return requestClient.post('/role/assignRoles', data);
}

/**
 * 根据角色id获取对应用户列表
 */
export async function getUsersByRoleId(roleId: any) {
  return requestClient.get(`role/getUsersList/${roleId}`);
}
