import { requestClient } from '#/api/request';

/**
 * 获取字典列表
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

/**
 * 根据编码字典获取字典
 */
export async function getDictByCode(key: string) {
  return requestClient.get(`/dict/findDictByCode/${key}`);
}
