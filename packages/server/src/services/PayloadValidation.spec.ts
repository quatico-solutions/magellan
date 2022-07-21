/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { readE2eTestData } from "../../../../jest.setup";
import { validate as testObj } from "./PayloadValidation";

describe("validate", () => {
    it("yields identical objects after serializing and deserializing an object", () => {
        const target = { name: "funny", surname: "bunny", age: 22, height: 1.721 };

        const actual = testObj({
            schemaName: "Person",
            payload: target,
            schemaLocation: "",
            repository: (name: string) => readTestData(name, "schema.json"),
        });

        expect(actual).toBe(true);
        expect(JSON.parse(JSON.stringify(target))).toEqual(target);
    });

    it("succeeds with payload object with simple types, numeric string surnamed", () => {
        const target = { name: "funny", surname: "1370124000000", age: 22, height: 1.721 };

        const actual = testObj({
            schemaName: "Person",
            payload: target,
            schemaLocation: "",
            repository: (name: string) => readTestData(name, "schema.json"),
        });

        expect(actual).toBe(true);
        expect(JSON.parse(JSON.stringify(target))).toEqual({
            name: "funny",
            surname: "1370124000000",
            age: 22,
            height: 1.721,
        });
    });

    it.skip.each(["Person"])("successfully validates Java serialized JSON %s against its JSON schema", (name: string) => {
        const target = readTestData(name, "json");

        const actual = testObj({
            schemaName: "Person",
            payload: target,
            schemaLocation: "",
            repository: (name: string) => readTestData(name, "schema.json"),
        });

        expect(actual).toBe(true);
    });

    it('successfully validates Typescript serialized JSON of "Person" against its JSON schema', () => {
        const target = {
            name: "fanny",
            surname: "may",
            age: 22,
            height: 1.721,
            children: [
                {
                    name: "chucky",
                    surname: "cheese",
                    age: 123,
                    height: 1.723,
                    children: [],
                    friends: Array.from(new Set(["Chuck Norris"])),
                    phoneNumbers: {},
                },
            ],
            friends: Array.from(new Set(["John McClane"])),
            phoneNumbers: new Map([["home", "123456"]]),
        };

        const actual = testObj({
            schemaName: "Person",
            payload: target,
            schemaLocation: "",
            repository: (name: string) => readTestData(name, "schema.json"),
        });

        expect(actual).toBe(true);
    });
});

const readTestData = (name: string, dataType: string) => JSON.parse(readE2eTestData({ name: name, dataType: dataType }));
