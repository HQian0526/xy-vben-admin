import { requestClient } from '#/api/request';

/**
 * 获取商品分类列表
 */
export async function getCatagoryListApi(param?: any) {
  return requestClient.get('/catagory/findCatagory', {
    params: param,
  });
}

/**
 * 新增商品分类
 */
export async function addCatagoryApi(data: any) {
  return requestClient.post('/catagory/addCatagory', data);
}

/**
 * 编辑商品分类
 */
export async function editCatagoryApi(data: any) {
  return requestClient.put('/catagory/updateCatagory', data);
}

/**
 * 删除商品分类
 */
export async function deleteCatagoryApi(data: any) {
  return requestClient.delete('/catagory/deleteCatagory', {
    data,
  });
}

/**
 * 获取商品列表
 */
export async function getProductListApi(param: any) {
  return requestClient.get('/product/findProduct', {
    params: param,
  });
}

/**
 * 新增商品
 */
export async function addProductApi(data: any) {
  return requestClient.post('/product/addProduct', data);
}

/**
 * 编辑商品
 */
export async function editProductApi(data: any) {
  return requestClient.put('/product/updateProduct', data);
}

/**
 * 删除商品
 */
export async function deleteProductApi(data: any) {
  return requestClient.delete('/product/deleteProduct', {
    data,
  });
}
