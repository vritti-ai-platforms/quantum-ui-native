// Shared response types — mirrors lib/types/ from @vritti/quantum-ui (web)

export type MutationResponse = {
  success: boolean;
  message: string;
};

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface CreateResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListResponse<T> {
  result: T[];
  count: number;
}
