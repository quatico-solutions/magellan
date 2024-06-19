/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

export enum SerializedTypes {
    Map = "map",
    Set = "set",
    Date = "date",
    Blob = "blob",
    Enum = "enum",
    Custom = "custom",
    BigInt = "bigint",
}

export type SerializedComplexType = {
    __type__: SerializedTypes;
    typehint: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
};

export const isSerializedComplexType = (it: any): it is SerializedComplexType => {
    if (!it || typeof it !== "object") {
        return false;
    }
    const keys = Object.keys(it);
    return keys.includes("__type__") && Object.values(SerializedTypes).includes(it.__type__) && keys.includes("value");
};
