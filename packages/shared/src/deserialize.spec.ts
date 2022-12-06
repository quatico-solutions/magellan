/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { readE2eTestData } from "../../../jest.setup";
import { deserialize, unpackObject, unpackPayload } from "./deserialize";
import { ResponsePayload } from "./transport";

describe("deserialize", () => {
    it("deserializes w/ a nested object", () => {
        const target = {
            name: "chuck",
            surname: "norris",
            birthday: { __type__: "date", value: new Date(1970, 1, 1).toISOString() },
            age: 666,
            colors: ["red", "green"],
            children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
            friends: {
                __type__: "map",
                value: { bff: { name: "john", surname: "McClane" } },
            },
            phone: { __type__: "set", value: ["0041791234567"] },
        };

        const actual = deserialize(JSON.stringify(wrapAsPayload(target)));

        expect(actual).toEqual(
            expect.objectContaining({
                data: {
                    name: "chuck",
                    surname: "norris",
                    birthday: new Date(1970, 1, 1),
                    age: 666,
                    colors: ["red", "green"],
                    children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
                    friends: new Map([["bff", { name: "john", surname: "McClane" }]]),
                    phone: new Set(["0041791234567"]),
                },
            })
        );
    });

    it("yields the error from a response containing a server execution error", () => {
        const target = { error: { message: "expected message", error: "expected error" } };

        const actual = deserialize(JSON.stringify(target));

        expect(actual).toEqual({ error: { message: "expected message", error: "expected error" } });
    });
});

describe("unpackPayload", () => {
    it("deserializes w/ a nested object", () => {
        const target = {
            name: "chuck",
            surname: "norris",
            birthday: { __type__: "date", value: new Date(1970, 1, 1).toISOString() },
            age: 666,
            colors: ["red", "green"],
            children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
            friends: {
                __type__: "map",
                value: { bff: { name: "john", surname: "McClane" } },
            },
            phone: { __type__: "set", value: ["0041791234567"] },
        };

        const actual = unpackPayload(wrapAsPayload(target));

        expect(actual).toEqual(
            expect.objectContaining({
                data: {
                    name: "chuck",
                    surname: "norris",
                    birthday: new Date(1970, 1, 1),
                    age: 666,
                    colors: ["red", "green"],
                    children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
                    friends: new Map([["bff", { name: "john", surname: "McClane" }]]),
                    phone: new Set(["0041791234567"]),
                },
            })
        );
    });

    it("yields the error from a response containing a server execution error", () => {
        const target = { error: { message: "expected message", error: "expected error" } };

        const actual = unpackPayload(target);

        expect(actual).toEqual({ error: { message: "expected message", error: "expected error" } });
    });
});

describe("unpackObject", () => {
    it("unpacks w/ a simple string", () => {
        const expected = "Input string";

        const actual = unpackObject(expected);

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ an object", () => {
        const expected = { valString: "test", valNumber: 13.2, valArray: ["something", 13] };

        const actual = unpackObject(expected);

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ an empty", () => {
        const expected = {};

        const actual = unpackObject(expected);

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ a date", () => {
        const expected = new Date(2021, 12, 31);

        const actual = unpackObject({ __type__: "date", value: expected.toISOString() });

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ a map", () => {
        const values: [string, number][] = [
            ["1", 1],
            ["2", 2],
        ];
        const expected = new Map(values);

        const actual = unpackObject({ __type__: "map", value: { "1": 1, "2": 2 } });

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ a set", () => {
        const values: string[] = ["monday", "tuesday", "wednesday"];
        const expected = new Set(values);

        const actual = unpackObject({ __type__: "set", value: values });

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ an array", () => {
        const expected = [1, "2", true];

        const actual = unpackObject(expected);

        expect(actual).toEqual(expected);
    });

    it("unpacks w/ an object with an array of objects", () => {
        const target = { persons: [{ name: "chuck", surname: "norris" }] };

        const actual = unpackObject(target);

        expect(actual).toEqual({ persons: [{ name: "chuck", surname: "norris" }] });
    });

    it("unpacks w/ an object with an map of objects", () => {
        const expected = {
            persons: {
                __type__: "map",
                value: { bff: { name: "chuck", surname: "norris" } },
            },
        };

        const actual = unpackObject(expected);

        expect(actual).toEqual({ persons: new Map([["bff", { name: "chuck", surname: "norris" }]]) });
    });

    it("unpacks w/ an object with a set of objects", () => {
        const expected = {
            days: {
                __type__: "set",
                value: [{ day: "monday" }, { day: "tuesday" }],
            },
        };

        const actual = unpackObject(expected);

        expect(actual).toEqual({
            days: new Set([{ day: "monday" }, { day: "tuesday" }]),
        });
    });

    it("unpacks w/ a complex nested datastructure", () => {
        const target = {
            lists: [
                {
                    __type__: "set",
                    value: [
                        {
                            __type__: "map",
                            value: {
                                expected: { day: "monday" },
                            },
                        },
                    ],
                },
            ],
        };

        const actual = unpackObject(target);

        expect(actual).toEqual({
            lists: [new Set([new Map([["expected", { day: "monday" }]])])],
        });
    });

    it("unpacks w/ a complex nested object", () => {
        const target = {
            address: {
                city: "Musterhausen",
                street: "Musterstrasse 9",
                zip: "1234",
            },
            birthday: { __type__: "date", value: new Date(1970, 4, 1).toISOString() },
            age: 22,
            children: [
                {
                    address: null,
                    age: 123,
                    children: [],
                    height: 1.723,
                    name: "chucky",
                    surname: "cheese",
                },
            ],
            colors: ["red", "green", 3, null],
            friends: { __type__: "map", value: { bff: { name: "john", surname: "McClane" } } },
            phone: { __type__: "set", value: ["0041791234567"] },
            height: 1.721,
            name: "fanny",
            surname: "may",
        };

        const actual = unpackObject(target);

        expect(actual).toEqual({
            name: "fanny",
            surname: "may",
            birthday: new Date(1970, 4, 1),
            age: 22,
            height: 1.721,
            children: [{ name: "chucky", surname: "cheese", age: 123, height: 1.723, children: [], address: null }],
            colors: ["red", "green", 3, null],
            friends: new Map([["bff", { name: "john", surname: "McClane" }]]),
            phone: new Set(["0041791234567"]),
            address: { street: "Musterstrasse 9", zip: "1234", city: "Musterhausen" },
        });
    });

    it("unpacks w/ a person from JSON", () => {
        const expected = {
            name: "fanny",
            surname: "may",
            age: 22,
            birthday: new Date(Date.UTC(1970, 3, 1)),
            height: 1.721,
            children: [
                {
                    address: null,
                    name: "chucky",
                    surname: "cheese",
                    age: 123,
                    friends: new Map(),
                    height: 1.723,
                    children: [],
                    birthday: new Date(Date.UTC(1999, 3, 1)),
                    tel: new Set(),
                },
            ],
            address: { street: "Musterstrasse 9", zip: "1234", city: "Musterhausen" },
            friends: new Map<string, unknown>([
                ["bff", "chucky cheese"],
                ["favorite", 3],
            ]),
            tel: new Set(["0791234567"]),
        };

        const actual = unpackObject(JSON.parse(readE2eTestData({ name: "Person", dataType: "json" })));

        expect(actual).toEqual(expected);
    });
});

const wrapAsPayload = (data: unknown): ResponsePayload => {
    return { data: data, getError: () => undefined };
};
