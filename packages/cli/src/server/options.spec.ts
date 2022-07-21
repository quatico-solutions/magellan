/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { getPort, getServerModuleDir } from "./options";

describe("getServerModuleDir", () => {
    it("should return ./expected w/ ./expected provided", () => {
        const expected = "./expected";

        const actual = getServerModuleDir({ serverModuleDir: expected });

        expect(actual).toBe(expected);
    });

    it("should return ./server-esm w/o serverModuleDir provided", () => {
        const actual = getServerModuleDir({});

        expect(actual).toBe("./server-esm");
    });
});

describe("getPort", () => {
    it("should return the port w/ a port cli argument", () => {
        const expected = 9999;

        const actual = getPort({ port: expected });

        expect(actual).toBe(expected);
    });

    it("should return 3000 w/o a cli argument", () => {
        const actual = getPort({});

        expect(actual).toBe(3000);
    });
});
