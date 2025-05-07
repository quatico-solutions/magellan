/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import fs from "fs";
import path from "path";
import { packObject, unpackObject } from "../../src";

const readTestFile = (filename: string): string => {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "..", "data", "serialization", filename)).toString());
};

/**
 * End 2 End Serialization Tests
 * These are the symmetrical tests to /packages/java/serialization/src/test/java/io/magellan/TransportSerializerTest.java.
 */
describe("Java-TypeScript Serialization End 2 End Test", () => {
    it.each([
        [{ string: "expected" }, readTestFile("string.json")],
        [{ number: 10 }, readTestFile("number_int.json")],
        [{ number: 10.1 }, readTestFile("number_float.json")],
        [{ number: 10.1 }, readTestFile("number_double.json")],
        [{ date: new Date(Date.UTC(2022, 6, 1, 0, 0, 0, 0)) }, readTestFile("date.json")],
        [{ bigint: BigInt("9223372036854775807") }, readTestFile("bigint.json")],
        [{ array: ["expected", "expected"] }, readTestFile("array.json")],
        [
            {
                map: new Map([
                    ["value1", "expected"],
                    ["value2", "expected"],
                ]),
            },
            readTestFile("map.json"),
        ],
        [{ set: new Set(["expected", "expected2", "expected3"]) }, readTestFile("set.json")],
    ])("serialized argument %s matches shared testdata %s", (target: unknown, expected: string) => {
        const actual = packObject(target);

        expect(actual).toEqual(expected);
    });

    it.each([
        [readTestFile("bigint.json"), { bigint: BigInt("9223372036854775807") }],
        [readTestFile("string.json"), { string: "expected" }],
        [readTestFile("number_int.json"), { number: 10 }],
        [readTestFile("number_float.json"), { number: 10.1 }],
        [readTestFile("number_double.json"), { number: 10.1 }],
        [readTestFile("date.json"), { date: new Date(Date.UTC(2022, 6, 1, 0, 0, 0, 0)) }],
        [readTestFile("array.json"), { array: ["expected", "expected"] }],
        [
            readTestFile("map.json"),
            {
                map: new Map([
                    ["value1", "expected"],
                    ["value2", "expected"],
                ]),
            },
        ],
        [readTestFile("set.json"), { set: new Set(["expected", "expected2", "expected3"]) }],
    ])("deserialized testdata %s matches argument %s", (target: string, expected: unknown) => {
        const actual = unpackObject(target);

        expect(actual).toEqual(expected);
    });
});
