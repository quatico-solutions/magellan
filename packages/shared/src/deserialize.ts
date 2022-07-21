/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { ResponsePayload } from "./transport";
import { isSerializedComplexType, SerializedComplexType, SerializedTypes } from "./types";

export const deserialize = <O>(jsonData: string): O => {
    const { data } = unpackObject(JSON.parse(jsonData)) as ResponsePayload;
    return data as O;
};

export const unpackPayload = <O = unknown>(payload: ResponsePayload): O => {
    const { data } = unpackObject(payload) as ResponsePayload;
    return data as O;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const unpackObject = (value: any): unknown => {
    const complexType = value as SerializedComplexType;

    if (isSerializedComplexType(complexType)) {
        if (complexType.__type__ === SerializedTypes.Date) {
            return new Date(complexType.value);
        } else if (complexType.__type__ === SerializedTypes.Map) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return complexType.value ? new Map(Object.entries(complexType.value).map((it: any) => [it.at(0), unpackObject(it.at(1))])) : new Map();
        } else if (complexType.__type__ === SerializedTypes.Set) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return complexType.value ? new Set(complexType.value.map((it: any) => unpackObject(it))) : new Set();
        }
        throw new Error(`Attempt to deserialize unknown type: ${complexType.__type__}, value: ${complexType.value}`);
    }

    if (value instanceof Array) {
        return value.map(it => unpackObject(it));
    }

    if (value instanceof Object) {
        return deserializeObject(value);
    }
    return value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deserializeObject = (value: any) => {
    const map = new Map<PropertyKey, unknown>();
    Object.entries(value).forEach(it => {
        const innerType = it.at(1) as SerializedComplexType;
        const key = it.at(0) as PropertyKey;
        const val = it.at(1);
        if (isSerializedComplexType(innerType) || val instanceof Object) {
            map.set(key, unpackObject(innerType));
        } else if (val instanceof Array) {
            map.set(
                key,
                val.map(elem => unpackObject(elem))
            );
        } else {
            map.set(key, val);
        }
    });
    return Object.fromEntries(map);
};
