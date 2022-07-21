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
}

export type SerializedComplexType = {
    __type__: SerializedTypes;
    typehint: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
};

export const isSerializedComplexType = (it: SerializedComplexType): it is SerializedComplexType => {
    return it && it.__type__ && it.value !== undefined;
};
