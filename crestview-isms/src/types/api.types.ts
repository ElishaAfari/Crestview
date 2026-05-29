export type ApiError = {
  error: string;
  status: number;
};

export type ApiSuccess<TData> = {
  data: TData;
};

export type ApiResult<TData> = ApiSuccess<TData> | ApiError;
