import { inject } from '@angular/core';
import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';
import { EntityId, addEntity, removeEntity, setEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, pipe, switchMap, tap } from 'rxjs';
import { BaseHttpService, QueryParams } from '../services/base-http.service';

interface EntityCrudState {
    loading: boolean;
    error: string | null;
}

/**
 * Composable feature that wires full CRUD operations to a REST endpoint via
 * BaseHttpService. Add it to any signalStore whose entity type has an `id`
 * field, and all state + async methods are injected automatically.
 *
 * @example
 * interface Product { id: number; name: string; price: number; }
 *
 * export const ProductStore = signalStore(
 *   { providedIn: 'root' },
 *   withEntityCrud<Product>('/api/products'),
 * );
 *
 * // In a component:
 * private readonly store = inject(ProductStore);
 * ngOnInit() { this.store.loadAll(); }
 * products = this.store.entities;   // Signal<Product[]>
 * loading  = this.store.loading;    // Signal<boolean>
 * error    = this.store.error;      // Signal<string | null>
 */
export function withEntityCrud<T extends { id: EntityId }>(endpoint: string) {
    return signalStoreFeature(
        withEntities<T>(),
        withState<EntityCrudState>({ loading: false, error: null }),
        withMethods((store, http = inject(BaseHttpService)) => ({
            /** Fetches all entities; optionally filtered by query params. */
            loadAll: rxMethod<QueryParams | void>(
                pipe(
                    tap(() => patchState(store, { loading: true, error: null })),
                    switchMap((query) =>
                        http.getAll<T>(endpoint, query ?? undefined).pipe(
                            tap((res) => patchState(store, setEntities(res.data), { loading: false })),
                            catchError((err: Error) => {
                                patchState(store, { loading: false, error: err.message });
                                return EMPTY;
                            })
                        )
                    )
                )
            ),

            /** POSTs a new entity and appends it to the collection. */
            create: rxMethod<Partial<T>>(
                pipe(
                    tap(() => patchState(store, { loading: true, error: null })),
                    switchMap((body) =>
                        http.create<T>(endpoint, body).pipe(
                            tap((res) => patchState(store, addEntity(res.data), { loading: false })),
                            catchError((err: Error) => {
                                patchState(store, { loading: false, error: err.message });
                                return EMPTY;
                            })
                        )
                    )
                )
            ),

            /** PATCHes an entity by id and merges the server response into the collection. */
            update: rxMethod<{ id: EntityId; body: Partial<T> }>(
                pipe(
                    tap(() => patchState(store, { loading: true, error: null })),
                    switchMap(({ id, body }) =>
                        http.patch<T>(endpoint, id, body).pipe(
                            tap((res) =>
                                patchState(
                                    store,
                                    updateEntity({ id, changes: res.data as Partial<T> }),
                                    { loading: false }
                                )
                            ),
                            catchError((err: Error) => {
                                patchState(store, { loading: false, error: err.message });
                                return EMPTY;
                            })
                        )
                    )
                )
            ),

            /** DELETEs an entity by id and removes it from the collection. */
            remove: rxMethod<EntityId>(
                pipe(
                    tap(() => patchState(store, { loading: true, error: null })),
                    switchMap((id) =>
                        http.delete<T>(endpoint, id).pipe(
                            tap(() => patchState(store, removeEntity(id), { loading: false })),
                            catchError((err: Error) => {
                                patchState(store, { loading: false, error: err.message });
                                return EMPTY;
                            })
                        )
                    )
                )
            ),
        }))
    );
}
