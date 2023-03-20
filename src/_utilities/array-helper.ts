export function mergeObjects(
  arr1: any[],
  arr2: any[],
  id: string
): any[] {
  const mergedArr: any[] = [];
  const objectIds: string[] = [];

  arr1.forEach((item: any) => {
    mergedArr.push(item);
    objectIds.push(item[id]);
  });

  arr2.forEach((item: any) => {
    if (!objectIds.includes(item[id])) {
      mergedArr.push(item);
      objectIds.push(item[id]);
    }
  });

  return mergedArr;
}
