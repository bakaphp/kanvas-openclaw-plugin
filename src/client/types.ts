export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{
    message: string;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
}

export interface ConnectionTestResult {
  ok: boolean;
  status: number;
  endpoint: string;
  hasData: boolean;
  errors: string[];
}
