/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { type QueryKey, useQuery } from "@tanstack/react-query";
import { type Context, type Serialization } from "@quatico/magellan-shared";

/**
 * Result type when query is disabled
 * Note: refetch is still available to manually trigger the query even when disabled
 */
export type MagellanQueryDisabledResult = {
    isLoading: false;
    isError: false;
    isSuccess: false;
    data: undefined;
    error: null;
    refetch: () => Promise<unknown>;
    isEnabled: false;
};

/**
 * Result type when query is enabled (default)
 * A discriminated union to ensure that the consumer can destructure the result and type narrowing still works
 * e.g. when doing `const { data, isLoading, isError, isSuccess, error } = useQueryService(...)`
 * then data is not "possibly undefined" when we've already checked that
 * isSuccess is true and/or isLoading and isError are false.
 *
 * IMPORTANT: When enabled defaults to true, checking !isLoading && !isError guarantees the success state
 */
export type MagellanQueryEnabledResult<TData> =
    // loading state
    | { isLoading: true; isError: false; isSuccess: false; data: undefined; error: null; refetch: () => Promise<unknown>; isEnabled: true }
    // error state
    | {
          isLoading: false;
          isError: true;
          isSuccess: false;
          data: undefined;
          error: Error;
          refetch: () => Promise<unknown>;
          isEnabled: true;
      }
    // success state
    | {
          isLoading: false;
          isError: false;
          isSuccess: true;
          data: TData;
          error: null;
          refetch: () => Promise<unknown>;
          isEnabled: true;
      };

/**
 * Combined result type that includes both enabled and disabled states
 * Used when enabled is a dynamic boolean value
 */
export type MagellanQueryResult<TData> = MagellanQueryDisabledResult | MagellanQueryEnabledResult<TData>;

// type helper to extract the resolved value from a Promise, removing undefined
type UnwrapPromise<T> = T extends Promise<infer U> ? NonNullable<U> : never;

/**
 * `useQueryService` is a hook for managing calls to magellan functions using react-query.
 *
 * @param queryKey - The query key to use for the query.
 * @param serviceFn - The remote function to call.
 * @param serviceFnArgs - The input to pass to the remote function (optional, defaults to null).
 * @param enabled - Set to false if the react-query should not run automatically (optional, defaults to true).
 * @returns Query result where `data` is guaranteed to be defined when `isError` and `isLoading` are false.
 */

// Overload for when enabled is explicitly false
export function useQueryService<TFn extends (input: never, _context?: Context, _serialization?: Serialization) => Promise<unknown>>(params: {
    queryKey: QueryKey;
    serviceFn: TFn;
    serviceFnArgs?: Parameters<TFn>[0];
    enabled: false;
}): MagellanQueryDisabledResult;

// Overload for when enabled is true or omitted (defaults to true)
export function useQueryService<TFn extends (input: never, _context?: Context, _serialization?: Serialization) => Promise<unknown>>(params: {
    queryKey: QueryKey;
    serviceFn: TFn;
    serviceFnArgs?: Parameters<TFn>[0];
    enabled?: true;
}): MagellanQueryEnabledResult<UnwrapPromise<ReturnType<TFn>>>;

// Overload for when enabled is a dynamic boolean (not literal true/false)
export function useQueryService<TFn extends (input: never, _context?: Context, _serialization?: Serialization) => Promise<unknown>>(params: {
    queryKey: QueryKey;
    serviceFn: TFn;
    serviceFnArgs?: Parameters<TFn>[0];
    enabled?: boolean;
}): MagellanQueryResult<UnwrapPromise<ReturnType<TFn>>>;

// Implementation
export function useQueryService<TFn extends (input: never, _context?: Context, _serialization?: Serialization) => Promise<unknown>>({
    queryKey,
    serviceFn,
    serviceFnArgs = null as Parameters<TFn>[0],
    enabled = true,
}: {
    queryKey: QueryKey;
    serviceFn: TFn;
    serviceFnArgs?: Parameters<TFn>[0];
    enabled?: boolean;
}): MagellanQueryResult<UnwrapPromise<ReturnType<TFn>>> {
    type TData = UnwrapPromise<ReturnType<TFn>>;
    const query = useQuery<TData, Error, TData, QueryKey>({
        queryKey,
        enabled,
        queryFn:
            /* We omit complex mock implementation for useQuery so queryFn is never called in unit tests */
            /* istanbul ignore next */
            async () => {
                const result = await serviceFn(serviceFnArgs);
                // NOTE: return explicit `null` for empty results, because react-query does not support `undefined`
                return (result ?? null) as TData;
            },
    });

    if (!enabled) {
        return {
            isLoading: false,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            refetch: query.refetch,
            isEnabled: false,
        };
    }

    if (query.isLoading) {
        return {
            isLoading: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            refetch: query.refetch,
            isEnabled: true,
        };
    }

    if (query.isError) {
        return {
            isLoading: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            error: ensureErrorType(query.error),
            refetch: query.refetch,
            isEnabled: true,
        };
    }

    if (query.isSuccess) {
        return {
            isLoading: false,
            isError: false,
            isSuccess: true,
            data: query.data,
            error: null,
            refetch: query.refetch,
            isEnabled: true,
        };
    }

    // Fallback: treat any other state as loading
    return {
        isLoading: true,
        isError: false,
        isSuccess: false,
        data: undefined,
        error: null,
        refetch: query.refetch,
        isEnabled: true,
    };
}

const ensureErrorType = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }

    const errorMessage = typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);

    return new Error(errorMessage);
};
