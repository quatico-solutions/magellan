/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { QueryClient, QueryClientContext, type QueryKey, type QueryObserverResult, type RefetchOptions, useQuery } from "@tanstack/react-query";
import { createQueryKey } from "../utils/keyFactory";
import { type ServiceFunction } from "../utils/ServiceFunction";
import { useContext, useMemo } from "react";

/**
 * Result type aligned with TanStack Query's discriminated union pattern.
 * Enables proper type narrowing when destructuring: `const { data, isPending, isError, isSuccess, error } = useQueryService(...)`
 *
 * States:
 * - Pending: Query hasn't started fetching yet
 * - Loading: First fetch in progress
 * - LoadingError: Error on initial fetch, no data available
 * - RefetchError: Error on background refetch, stale data still available
 * - Success: Query succeeded, data available
 *
 * Type narrowing examples:
 * - `if (isSuccess)` → data is TData
 * - `if (isPending)` → data is undefined
 * - `if (isError && isLoadingError)` → data is undefined (no stale data)
 * - `if (isError && isRefetchError)` → data is TData (stale data available)
 */
export type MagellanQueryResult<TData, TError = Error> =
    | MagellanQueryPendingResult<TData, TError>
    | MagellanQueryLoadingResult<TData, TError>
    | MagellanQueryLoadingErrorResult<TData, TError>
    | MagellanQueryRefetchErrorResult<TData, TError>
    | MagellanQuerySuccessResult<TData, TError>;

/**
 * Query is pending but hasn't started fetching yet
 */
export type MagellanQueryPendingResult<TData, TError = Error> = {
    data: undefined;
    error: null;
    isError: false;
    isPending: true;
    isLoading: false;
    isLoadingError: false;
    isRefetchError: false;
    isSuccess: false;
    isEnabled: boolean;
    status: "pending";
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData, TError>>;
};

/**
 * First fetch in progress (isPending && isLoading both true)
 */
export type MagellanQueryLoadingResult<TData, TError = Error> = {
    data: undefined;
    error: null;
    isError: false;
    isPending: true;
    isLoading: true;
    isLoadingError: false;
    isRefetchError: false;
    isSuccess: false;
    isEnabled: true;
    status: "pending";
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData, TError>>;
};

/**
 * Error occurred during initial fetch, no data available
 */
export type MagellanQueryLoadingErrorResult<TData, TError = Error> = {
    data: undefined;
    error: TError;
    isError: true;
    isPending: false;
    isLoading: false;
    isLoadingError: true;
    isRefetchError: false;
    isSuccess: false;
    isEnabled: true;
    status: "error";
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData, TError>>;
};

/**
 * Error occurred during background refetch, stale data is still available
 */
export type MagellanQueryRefetchErrorResult<TData, TError> = {
    data: TData;
    error: TError;
    isError: true;
    isPending: false;
    isLoading: false;
    isLoadingError: false;
    isRefetchError: true;
    isSuccess: false;
    isEnabled: true;
    status: "error";
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData, TError>>;
};

/**
 * Query succeeded, data is available
 */
export type MagellanQuerySuccessResult<TData, TError> = {
    data: TData;
    error: null;
    isError: false;
    isPending: false;
    isLoading: false;
    isLoadingError: false;
    isRefetchError: false;
    isSuccess: true;
    isEnabled: true;
    status: "success";
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData, TError>>;
};

// type helper to extract the resolved value from a Promise, removing undefined
type UnwrapPromise<T> = T extends Promise<infer U> ? NonNullable<U> : never;

export type UseQueryServiceParams<TFn extends ServiceFunction> = {
    serviceFn: TFn;
    serviceFnArgs?: Parameters<TFn>[0];
    options?: {
        queryKey?: QueryKey;
        enabled?: boolean;
        queryClient?: QueryClient;
    };
};

/**
 * `useQueryService` is a hook for managing calls to magellan functions using react-query.
 *
 * @template TFn - The service function type
 * @template TError - The error type (defaults to Error)
 * @param serviceFn - The remote function to call.
 * @param serviceFnArgs - The input to pass to the remote function (optional, defaults to null).
 * @param options - Further options to configure the underlying useQuery functionality.
 * @param options.queryKey - The query key to use for the query (optional, defaults to function name if possible, throws error if not).
 * @param options.enabled - Set to false if the react-query should not run automatically (optional, defaults to true).
 * @returns Query result with proper type narrowing. Use `isSuccess`, `isPending`, or `isError` to narrow types.
 * @throws Error if queryKey is not provided and cannot be created from serviceFn.
 *
 * @example
 * // Basic usage
 * const { data, isPending, isError } = useQueryService({
 *   serviceFn: fetchUser,
 *   serviceFnArgs: { id: 1 }
 * });
 *
 * @example
 * // Type narrowing with isSuccess
 * if (isSuccess) {
 *   console.log(data); // data is User (not undefined)
 * }
 *
 * @example
 * // Distinguish loading error from refetch error
 * if (isError && isLoadingError) {
 *   return <ErrorState />; // No data available
 * }
 * if (isError && isRefetchError) {
 *   return <DataWithError data={data} />; // Stale data available
 * }
 */
export const useQueryService = <TFn extends ServiceFunction, TError = Error>({
    serviceFn,
    serviceFnArgs = null as Parameters<TFn>[0],
    options,
}: UseQueryServiceParams<TFn>): MagellanQueryResult<UnwrapPromise<ReturnType<TFn>>, TError> => {
    type TData = UnwrapPromise<ReturnType<TFn>>;

    const enabled = options?.enabled ?? true;
    const queryKey = options?.queryKey;
    const finalQueryKey = queryKey ?? createQueryKey(serviceFn, serviceFnArgs);

    if (!finalQueryKey) {
        throw new Error("Please provide a query key!");
    }

    const providerQueryClient = useContext(QueryClientContext);

    const defaultQueryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutes
                        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
        []
    );

    // Priority: options.queryClient > providerQueryClient > defaultQueryClient
    const queryClient = options?.queryClient ?? providerQueryClient ?? defaultQueryClient;

    const query = useQuery<TData, Error, TData, QueryKey>(
        {
            queryKey: finalQueryKey,
            enabled,
            queryFn:
                /* We omit complex mock implementation for useQuery so queryFn is never called in unit tests */
                /* istanbul ignore next */
                async () => {
                    const result = await serviceFn(serviceFnArgs);
                    // NOTE: return explicit `null` for empty results, because react-query does not support `undefined`
                    return (result ?? null) as TData;
                },
        },
        queryClient
    );

    // Wrap refetch to convert error type from Error to TError
    const wrappedRefetch = async (options?: RefetchOptions): Promise<QueryObserverResult<TData, TError>> => {
        const result = await query.refetch(options);
        // Transform the error type if present
        if (result.error) {
            return {
                ...result,
                error: ensureErrorType<TError>(result.error),
            } as QueryObserverResult<TData, TError>;
        }
        return result as QueryObserverResult<TData, TError>;
    };

    // Map TanStack Query states to Magellan states
    // Status can be: 'pending', 'error', 'success'

    if (query.status === "pending") {
        // Distinguish between pending (not started) and loading (first fetch in progress)
        if (query.isLoading) {
            // Loading: First fetch in progress
            return {
                data: undefined,
                error: null,
                isError: false,
                isPending: true,
                isLoading: true,
                isLoadingError: false,
                isRefetchError: false,
                isSuccess: false,
                isEnabled: true,
                status: "pending",
                refetch: wrappedRefetch,
            };
        }
        // Pending: Query hasn't started fetching yet (could be disabled)
        return {
            data: undefined,
            error: null,
            isError: false,
            isPending: true,
            isLoading: false,
            isLoadingError: false,
            isRefetchError: false,
            isSuccess: false,
            isEnabled: enabled,
            status: "pending",
            refetch: wrappedRefetch,
        };
    }

    if (query.status === "error") {
        // Distinguish between loading error (no data) and refetch error (has stale data)
        // In TanStack Query v5, we check if data exists to determine if it's a refetch error
        if (query.data !== undefined) {
            // RefetchError: Error on background refetch, stale data available
            return {
                data: query.data,
                error: ensureErrorType<TError>(query.error),
                isError: true,
                isPending: false,
                isLoading: false,
                isLoadingError: false,
                isRefetchError: true,
                isSuccess: false,
                isEnabled: true,
                status: "error",
                refetch: wrappedRefetch,
            };
        }
        // LoadingError: Error on initial fetch, no data available
        return {
            data: undefined,
            error: ensureErrorType<TError>(query.error),
            isError: true,
            isPending: false,
            isLoading: false,
            isLoadingError: true,
            isRefetchError: false,
            isSuccess: false,
            isEnabled: true,
            status: "error",
            refetch: wrappedRefetch,
        };
    }

    // Success state
    return {
        data: query.data,
        error: null,
        isError: false,
        isPending: false,
        isLoading: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        isEnabled: true,
        status: "success",
        refetch: wrappedRefetch,
    };
};

const ensureErrorType = <TError>(error: unknown): TError => {
    // If the error is already of the expected type, return it
    // For the default Error type, check instanceof Error
    if (error instanceof Error) {
        return error as TError;
    }

    // If TError is Error and error is not an Error instance, wrap it
    const errorMessage = typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);

    return new Error(errorMessage) as TError;
};
