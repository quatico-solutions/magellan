/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { readE2eTestData } from "../../../jest.setup";
import { packInput, packObject, serialize } from "./serialize";
import { ResponsePayload } from "./transport";

describe("serialize", () => {
    it("serializes w/ a nested object", () => {
        const target = {
            name: "chuck",
            surname: "norris",
            age: 666,
            colors: ["red", "green"],
            children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
            friends: new Map([["bff", { name: "john", surname: "McClane" }]]),
            phone: new Set(["0041791234567"]),
        };

        const actual = serialize(target);

        expect(actual).toEqual(
            JSON.stringify(
                wrapAsPayload({
                    name: "chuck",
                    surname: "norris",
                    age: 666,
                    colors: ["red", "green"],
                    children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
                    friends: {
                        __type__: "map",
                        value: { bff: { name: "john", surname: "McClane" } },
                    },
                    phone: { __type__: "set", value: ["0041791234567"] },
                })
            )
        );
    });
});

describe("packInput", () => {
    it("serializes w/ a nested object", () => {
        const target = {
            name: "chuck",
            surname: "norris",
            age: 666,
            colors: ["red", "green"],
            children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
            friends: new Map([["bff", { name: "john", surname: "McClane" }]]),
            phone: new Set(["0041791234567"]),
        };

        const actual = packInput(target);

        expect(JSON.parse(actual)).toEqual({
            name: "chuck",
            surname: "norris",
            age: 666,
            colors: ["red", "green"],
            children: [{ name: "chucky", surname: "cheese", age: 0.5 }],
            friends: {
                __type__: "map",
                value: { bff: { name: "john", surname: "McClane" } },
            },
            phone: { __type__: "set", value: ["0041791234567"] },
        });
    });
});

describe("packObject", () => {
    it("packs w/ a simple string", () => {
        const expected = "Input string";

        const actual = packObject(expected);

        expect(actual).toEqual(expected);
    });

    it("packs w/ a simple number", () => {
        const expected = 10;

        const actual = packObject(expected);

        expect(actual).toEqual(expected);
    });

    it("packs w/ an object", () => {
        const expected = { valString: "test", valNumber: 13.2, valArray: ["something", 13] };

        const actual: any = packObject(expected);

        expect(actual).toEqual(expected);
    });

    it("packs w/ an empty object", () => {
        const expected = {};

        const actual = packObject(expected);

        expect(actual).toEqual({});
    });

    it("packs w/ a date", () => {
        const expected = new Date(Date.UTC(2021, 11, 31));

        const actual = packObject(expected);

        expect(actual).toEqual({ __type__: "date", value: "2021-12-31T00:00:00.000Z" });
    });

    it("packs w/ a map", () => {
        const target = new Map([
            ["1", 1],
            ["2", 2],
        ]);

        const actual = packObject(target);

        expect(actual).toEqual({ __type__: "map", value: { "1": 1, "2": 2 } });
    });

    it("packs w/ a set", () => {
        const expected: string[] = ["monday", "tuesday", "wednesday"];
        const target = new Set(expected);

        const actual = packObject(target);

        expect(actual).toEqual({ __type__: "set", value: expected });
    });

    it("packs w/ an array", () => {
        const expected = [1, "2", true];

        const actual = packObject(expected);

        expect(actual).toEqual(expected);
    });

    it("packs w/ an object with an array of objects", () => {
        const expected = { persons: [{ name: "chuck", surname: "norris" }] };

        const actual = packObject(expected);

        expect(actual).toEqual({ persons: [{ name: "chuck", surname: "norris" }] });
    });

    it("packs w/ an object with an map of objects", () => {
        const expected = { persons: new Map([["bff", { name: "chuck", surname: "norris" }]]) };

        const actual = packObject(expected);

        expect(actual).toEqual({
            persons: {
                __type__: "map",
                value: { bff: { name: "chuck", surname: "norris" } },
            },
        });
    });

    it("packs w/ an object with a set of objects", () => {
        const expected = {
            days: new Set([{ day: "monday" }, { day: "tuesday" }]),
        };

        const actual = packObject(expected);

        expect(actual).toEqual({
            days: {
                __type__: "set",
                value: [{ day: "monday" }, { day: "tuesday" }],
            },
        });
    });

    it("packs w/ a complex nested datastructure", () => {
        const target = {
            lists: [new Set([new Map([["expected", { day: "monday" }]])])],
        };

        const actual = packObject(target);

        expect(actual).toEqual({
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
        });
    });

    it("packs w/ a complex nested object", () => {
        const target = {
            name: "fanny",
            surname: "may",
            birthday: new Date(Date.UTC(1970, 3, 1)),
            age: 22,
            height: 1.721,
            children: [{ name: "chucky", surname: "cheese", age: 123, height: 1.723, children: [], address: null }],
            colors: ["red", "green", 3, null],
            friends: new Map([["bff", { name: "john", surname: "McClane" }]]),
            phone: new Set(["0041791234567"]),
            address: { street: "Musterstrasse 9", zip: "1234", city: "Musterhausen" },
        };

        const actual = packObject(target);

        expect(actual).toEqual({
            address: {
                city: "Musterhausen",
                street: "Musterstrasse 9",
                zip: "1234",
            },
            birthday: { __type__: "date", value: "1970-04-01T00:00:00.000Z" },
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
            friends: {
                __type__: "map",
                value: { bff: { name: "john", surname: "McClane" } },
            },
            phone: { __type__: "set", value: ["0041791234567"] },
            height: 1.721,
            name: "fanny",
            surname: "may",
        });
    });

    it("packs w/ a person to Java JSON", () => {
        const target = {
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
                    friends: new Map<string, unknown>(),
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

        const actual = packObject(target);

        expect(actual).toEqual(JSON.parse(readE2eTestData({ name: "Person", dataType: "json" })));
    });
});

const wrapAsPayload = (data: unknown): ResponsePayload => {
    return { data: data };
};
