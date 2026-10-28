import { requestClient } from '#/api/request';

export function getStoreStaffListApi(param: any) {
  return requestClient.get('/storeStaff/findStoreStaff', {
    params: param,
  });
}

export function addStoreStaffApi(data: any) {
  return requestClient.post('/storeStaff/addStoreStaff', data);
}

export function editStoreStaffApi(data: any) {
  return requestClient.put('/storeStaff/updateStoreStaff', data);
}

export function deleteStoreStaffApi(data: any) {
  return requestClient.delete('/storeStaff/deleteStoreStaff', {
    data,
  });
}
