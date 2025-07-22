import { requestClient } from '#/api/request';

/**
 * 获取角色列表
 */
export async function getDictListApi(param: any) {
  return requestClient.get('/dict/findDict', {
    params: param,
  });
}

/**
 * 新增
 */
export async function addDictApi(data: any) {
  return requestClient.post('/dict/addDict', data);
}

/**
 * 编辑
 */
export async function editDictApi(data: any) {
  return requestClient.put('/dict/updateDict', data);
}

/**
 * 删除
 */
export async function deleteDictApi(data: any) {
  return requestClient.delete('/dict/deleteDict', {
    data,
  });
}
