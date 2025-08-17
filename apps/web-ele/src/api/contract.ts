import { requestClient } from '#/api/request';

/**
 * 查询列表
 */
export async function getContractListApi(param: any) {
  return requestClient.get('/contract/findContract', {
    params: param,
  });
}

/**
 * 新增
 */
export async function addContractApi(data: any) {
  return requestClient.post('/contract/addContract', data);
}

/**
 * 编辑
 */
export async function editContractApi(data: any) {
  return requestClient.put('/contract/updateContract', data);
}

/**
 * 删除
 */
export async function deleteContractApi(data: any) {
  return requestClient.delete('/contract/deleteContract', {
    data,
  });
}

/**
 * 保存合同细则
 */
export async function saveContractItem(data: any) {
  return requestClient.post('/contract/saveContractItems', data);
}

/**
 * 查询合同细则列表
 */
export async function getContractItemList(no: string) {
  return requestClient.get(`/contract/getContractItem/${no}`);
}
