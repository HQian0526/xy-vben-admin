import { requestClient } from '#/api/request';

export async function getContractListApi(param: any) {
  return requestClient.get('/esign/contract/findContract', { params: param });
}

export async function addContractApi(data: any) {
  return requestClient.post('/esign/contract/addContract', data);
}

export async function editContractApi(data: any) {
  return requestClient.put('/esign/contract/updateContract', data);
}

export async function previewContractContentApi(data: any) {
  return requestClient.post('/esign/contract/previewContent', data);
}

export async function deleteContractApi(data: any) {
  return requestClient.delete('/esign/contract/deleteContract', { data });
}

export async function getContractDetailApi(contractNo: string) {
  return requestClient.get(`/esign/contract/detail/${contractNo}`);
}

export async function initiateSignApi(contractNo: string) {
  return requestClient.post('/esign/contract/initiate', { contractNo });
}

export async function platformSignApi(contractNo: string) {
  return requestClient.post('/esign/contract/platformSign', { contractNo });
}

export async function voidContractApi(contractNo: string, reason?: string) {
  return requestClient.post('/esign/contract/void', { contractNo, reason });
}

export async function exportContractApi(param: any) {
  return requestClient.download('/esign/contract/export', { params: param });
}

export async function downloadContractFileApi(contractNo: string) {
  return requestClient.download(`/esign/contract/file/${contractNo}`);
}

export async function getContractTempApi(param: any) {
  return requestClient.get('/esign/template/findTemplate', { params: param });
}

export async function addContractTempApi(data: any) {
  return requestClient.post('/esign/template/addTemplate', data);
}

export async function editContractTempApi(data: any) {
  return requestClient.put('/esign/template/updateTemplate', data);
}

export async function deleteContractTempApi(data: any) {
  return requestClient.delete('/esign/template/deleteTemplate', { data });
}

export async function getContractVarApi(param: any) {
  return requestClient.get('/esign/var/findVar', { params: param });
}

export async function addContractVarApi(data: any) {
  return requestClient.post('/esign/var/addVar', data);
}

export async function editContractVarApi(data: any) {
  return requestClient.put('/esign/var/updateVar', data);
}

export async function deleteContractVarApi(data: any) {
  return requestClient.delete('/esign/var/deleteVar', { data });
}
