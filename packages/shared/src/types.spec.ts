/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { isSerializedComplexType, SerializedTypes } from "./types";

describe("isSerializedComplexType", () => {
    it.each([
        [{ input: undefined }],
        [{ input: null }],
        [{ input: "" }],
        [{ input: 10 }],
        [{ input: [] }],
        [{ input: new Map() }],
        [{ input: {} }],
        [{ input: { __type__: "bigint" } }],
        [{ input: { value: "" } }],
        [{ input: { __type__: "", value: "" } }],
    ])("yields false, with undefined, non-object or incomplete input", ({ input }: { input: any }) => {
        expect(isSerializedComplexType(input)).toBeFalsy();
    });

    it.each(
        Object.values(SerializedTypes).map(value => ({
            input: { __type__: value, value: "<some>" },
        }))
    )("yields true, with undefined, non-object or incomplete input", ({ input }) => {
        expect(isSerializedComplexType(input)).toBeTruthy();
    });
});
