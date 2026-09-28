export interface ApiFieldError {
  [fieldName: string]: string[];
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: ApiFieldError;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  fieldErrors?: ApiFieldError
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}
