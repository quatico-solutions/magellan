/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { readE2eTestData } from "../../../jest.setup";
import { deserialize, serialize } from "../src";

describe("Serialize-Deserialize equality", () => {
    it("yields the identical object w/ a nested object", () => {
        const child = { name: "funny", surname: "bunny", age: 22, height: 1.721, friends: ["Chuck Norris", "John McClane"] };
        const expected = { name: "funny", surname: "bunny", age: 22, height: 1.721, children: [child, child, child] };

        const actual = deserialize(serialize(expected));

        expect(actual).toStrictEqual(expected);
    });

    it("yields the identical object w/ an object with array", () => {
        const expected = { valString: "test", valNumber: 13.2, valArray: ["something", 13] };

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical object w/ an empty object", () => {
        const expected = {};

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical object w/ a date", () => {
        const expected = new Date(2021, 12, 31);

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical object w/ a map", () => {
        const expected = new Map([
            ["1", 1],
            ["2", 2],
        ]);

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical object w/ a set", () => {
        const expected = new Set([
            ["1", 1],
            ["2", 2],
        ]);

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical object w/ an array", () => {
        const expected = [1, "2", true];

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical object w/ a complex nested object", () => {
        const expected = {
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
        };

        const actual = deserialize(serialize(expected));

        expect(actual).toEqual(expected);
    });

    it("yields the identical data w/ a deserialized-serialized java object", () => {
        const expected = JSON.stringify(wrapAsPayload(readE2eTestData({ name: "Person", dataType: "json" })));

        const actual = serialize(deserialize(expected));

        expect(actual).toStrictEqual(expected);
    });
});

describe("Java - Javascript serialisation-deserialisation equality", () => {
    it("yields the identical payload w/ a deserialized java object", () => {
        const expected = JSON.parse(readE2eTestData({ name: "Person", dataType: "json" }));

        const actual = deserialize(JSON.stringify(wrapAsPayload(expected)));

        expect(actual).toEqual({
            address: {
                city: "Musterhausen",
                street: "Musterstrasse 9",
                zip: "1234",
            },
            age: 22,
            birthday: new Date(Date.UTC(1970, 3, 1)),
            children: [
                {
                    address: null,
                    age: 123,
                    birthday: new Date(Date.UTC(1999, 3, 1)),
                    children: [],
                    friends: new Map(),
                    height: 1.723,
                    name: "chucky",
                    surname: "cheese",
                    tel: new Set(),
                },
            ],
            height: 1.721,
            name: "fanny",
            surname: "may",
            friends: new Map<string, unknown>([
                ["bff", "chucky cheese"],
                ["favorite", 3],
            ]),
            tel: new Set(["0791234567"]),
        });
    });

    it("yields the identical payload w/ a serialized object", () => {
        const target = {
            address: {
                city: "Musterhausen",
                street: "Musterstrasse 9",
                zip: "1234",
            },
            age: 22,
            birthday: new Date(Date.UTC(1970, 3, 1)),
            children: [
                {
                    address: null,
                    age: 123,
                    birthday: new Date(Date.UTC(1999, 3, 1)),
                    children: [],
                    friends: new Map(),
                    height: 1.723,
                    name: "chucky",
                    surname: "cheese",
                    tel: new Set(),
                },
            ],
            friends: new Map<string, unknown>([
                ["bff", "chucky cheese"],
                ["favorite", 3.0],
            ]),
            height: 1.721,
            name: "fanny",
            surname: "may",
            tel: new Set(["0791234567"]),
        };

        const actual = serialize(target);

        expect(actual).toBe(JSON.stringify(wrapAsPayload(JSON.parse(readE2eTestData({ name: "Person", dataType: "json" })))));
    });
});

const wrapAsPayload = (data: unknown): unknown => {
    return { data: data };
};
