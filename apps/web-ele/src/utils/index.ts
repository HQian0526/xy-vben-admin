import { getDictByCode } from '#/api';

export const getDict = async (code: string) => {
  try {
    const res = await getDictByCode(code);
    if (res.code === 200) {
      const itemList = JSON.parse(res.data.dictJson);
      return itemList.length > 0
        ? itemList.map((item: any) => ({
            label: item.value,
            value: item.key,
          }))
        : [];
    }
    return [];
  } catch (error) {
    console.error('获取字典失败:', error);
    return [];
  }
};
