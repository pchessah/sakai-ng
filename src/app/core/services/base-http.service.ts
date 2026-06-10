import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

/** Flat map of HTTP query-string parameters. */
export type QueryParams = Record<string, string | number | boolean>;

/**
 * Generic base service covering all standard CRUD operations.
 * Extend this class (or inject it directly) to interact with any REST resource.
 *
 * @example
 * @Injectable({ providedIn: 'root' })
 * export class ProductService extends BaseHttpService {
 *   private readonly endpoint = '/api/products';
 *   getProducts() { return this.getAll<Product>(this.endpoint); }
 * }
 */
@Injectable({ providedIn: 'root' })
export class BaseHttpService {
    protected readonly http = inject(HttpClient);

    /** Converts a plain object into Angular `HttpParams`. */
    protected buildParams(query?: QueryParams): HttpParams {
        let params = new HttpParams();
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                params = params.set(key, String(value));
            });
        }
        return params;
    }

    /** Fetches all resources at `url`, with optional query filtering. */
    getAll<T>(url: string, query?: QueryParams): Observable<ApiResponse<T[]>> {
        return this.http.get<ApiResponse<T[]>>(url, {
            params: this.buildParams(query),
        });
    }

    /** Fetches a server-paginated resource list. */
    getPaginated<T>(url: string, query?: QueryParams): Observable<PaginatedResponse<T>> {
        return this.http.get<PaginatedResponse<T>>(url, {
            params: this.buildParams(query),
        });
    }

    /** Fetches a single resource by its identifier. */
    getById<T>(url: string, id: string | number): Observable<ApiResponse<T>> {
        return this.http.get<ApiResponse<T>>(`${url}/${id}`);
    }

    /** Creates a new resource. `B` defaults to `Partial<T>` but can be overridden. */
    create<T, B = Partial<T>>(url: string, body: B): Observable<ApiResponse<T>> {
        return this.http.post<ApiResponse<T>>(url, body);
    }

    /** Full replacement update (PUT). */
    update<T, B = Partial<T>>(
        url: string,
        id: string | number,
        body: B
    ): Observable<ApiResponse<T>> {
        return this.http.put<ApiResponse<T>>(`${url}/${id}`, body);
    }

    /** Partial update (PATCH). */
    patch<T, B = Partial<T>>(
        url: string,
        id: string | number,
        body: B
    ): Observable<ApiResponse<T>> {
        return this.http.patch<ApiResponse<T>>(`${url}/${id}`, body);
    }

    /** Deletes a resource by its identifier. */
    delete<T>(url: string, id: string | number): Observable<ApiResponse<T>> {
        return this.http.delete<ApiResponse<T>>(`${url}/${id}`);
    }
}
