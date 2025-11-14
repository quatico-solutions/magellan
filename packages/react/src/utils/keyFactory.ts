/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { type QueryKey, type MutationKey } from "@tanstack/react-query";
import { type ServiceFunction } from "./ServiceFunction";

/**
 * Extracts the function name from a service function for use as a key.
 * Arrow functions are not supported and return undefined.
 *
 * @param serviceFn - The service function to extract the name from
 * @returns The function name or undefined
 */
const getFunctionName = (serviceFn: ServiceFunction): string | undefined => {
    if (serviceFn.name) {
        return serviceFn.name;
    }

    const funcString = serviceFn.toString();
    const functionMatch = funcString.match(/^(?:async\s+)?function\s+(\w+)/);
    if (functionMatch && functionMatch[1]) {
        return functionMatch[1];
    }

    return undefined;
};

/**
 * Creates a query key from a service function name.
 *
 * @param serviceFn - The service function to create a key for
 * @param additionalKeys - Optional additional keys to append
 * @returns A query key array
 */
export const createQueryKey = (serviceFn: ServiceFunction, ...additionalKeys: unknown[]): QueryKey | undefined => {
    const functionName = getFunctionName(serviceFn);
    if (!functionName) {
        return undefined;
    }
    return [functionName, ...additionalKeys];
};

/**
 * Creates a mutation key from a service function name.
 *
 * @param serviceFn - The service function to create a key for
 * @param additionalKeys - Optional additional keys to append
 * @returns A mutation key array
 */
export const createMutationKey = (serviceFn: ServiceFunction, ...additionalKeys: unknown[]): MutationKey | undefined => {
    const functionName = getFunctionName(serviceFn);
    if (!functionName) {
        return undefined;
    }
    return [functionName, ...additionalKeys];
};
