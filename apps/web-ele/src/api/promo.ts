import { requestClient } from '#/api/request';

export async function getMallPromoListApi(param: any) {
  return requestClient.get('/mallPromo/findMallPromo', {
    params: param,
  });
}

export async function addMallPromoApi(data: any) {
  return requestClient.post('/mallPromo/addMallPromo', data);
}

export async function editMallPromoApi(data: any) {
  return requestClient.put('/mallPromo/updateMallPromo', data);
}

export async function deleteMallPromoApi(data: any) {
  return requestClient.delete('/mallPromo/deleteMallPromo', {
    data,
  });
}
