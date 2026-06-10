/** Wraps every API response in a uniform envelope. */
export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
    statusCode: number;
}

/** Extends the base envelope with server-side pagination metadata. */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

/** Structured error payload returned by the API on failure. */
export interface ApiError {
    statusCode: number;
    message: string;
    /** Field-level validation errors keyed by property name. */
    errors?: Record<string, string[]>;
}
