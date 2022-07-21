/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { SerializedTypes } from "./types";

export const serialize = <I>(input: I): string => JSON.stringify(packObject({ data: input }));

export const packInput = <I>(input: I): string => JSON.stringify(packObject(input));

export const packObject = (value: unknown): unknown => {
    if (value instanceof Array) {
        return value.map(it => packObject(it));
    } else if (value instanceof Date) {
        // The slice removes the millisecond part.
        return { __type__: SerializedTypes.Date, value: value.toISOString() };
    } else if (value instanceof Map) {
        return {
            __type__: SerializedTypes.Map,
            value: value.size < 1 ? null : Object.fromEntries(Array.from(value.entries()).map(it => [it.at(0), packObject(it.at(1))])),
        };
    } else if (value instanceof Set) {
        return { __type__: SerializedTypes.Set, value: value.size < 1 ? null : Array.from(value.values()).map(it => packObject(it)) };
    } else if (value instanceof Object) {
        const fields = Object.entries(value).map(it => [it.at(0), packObject(it.at(1))]);
        return Object.fromEntries(fields);
    }
    return value;
};
