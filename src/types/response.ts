export type TableResponse<T> = {
  pageSize: number;
  page: number;
  total: number;
  totalPage: number;
  items: T[];
};
