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

/**
 * 查询合同模板列表
 */
export async function getContractTempApi(param: any) {
  return requestClient.get('/contract-template/findContractTemp', {
    params: param,
  });
}

/**
 * 新增合同模板
 */
export async function addContractTempApi(data: any) {
  return requestClient.post('/contract-template/addContractTemp', data);
}

/**
 * 编辑合同模板
 */
export async function editContractTempApi(data: any) {
  return requestClient.put('/contract-template/updateContractTemp', data);
}

/**
 * 删除合同模板
 */
export async function deleteContractTempApi(data: any) {
  return requestClient.delete('/contract-template/deleteContractTemp', {
    data,
  });
}

/**
 * 预览合同模板
 */
export async function previewContractTempApi(templateNo: string) {
  return requestClient.get(`/preview/${templateNo}`);
}
