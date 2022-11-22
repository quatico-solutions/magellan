/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import fs from "fs";
import { recursiveFind, loadModules } from "./module-loader";

describe("loadModules", () => {
    it("calls registerFunction with single file and export", () => {
        const target = { registerFunction: jest.fn() } as any;
        fs.writeFileSync(`./folder/function-zip.js`, "whatever");

        loadModules("./folder", jest.fn().mockReturnValue({ zip: jest.fn() }) as any, target);

        expect(target.registerFunction).toHaveBeenCalledWith("zip", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledTimes(1);
    });

    it("calls registerFunction with multiple files and single export", () => {
        const target = { registerFunction: jest.fn() } as any;
        fs.writeFileSync(`./folder/function-zip.js`, "whatever");
        fs.writeFileSync(`./folder/function-zap.js`, "whatever");
        fs.writeFileSync(`./folder/function-zup.js`, "whatever");

        loadModules(
            "./folder",
            jest.fn().mockReturnValueOnce({ zip: jest.fn() }).mockReturnValueOnce({ zap: jest.fn() }).mockReturnValueOnce({ zup: jest.fn() }) as any,
            target
        );

        expect(target.registerFunction).toHaveBeenCalledWith("zip", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledWith("zap", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledWith("zup", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledTimes(3);
    });

    it("calls registerFunction with single file and multiple exports", () => {
        const target = { registerFunction: jest.fn() } as any;
        fs.writeFileSync(`./folder/functions.js`, "whatever");

        loadModules("./folder", jest.fn().mockReturnValue({ zip: jest.fn(), zap: jest.fn(), zup: jest.fn() }) as any, target);

        expect(target.registerFunction).toHaveBeenCalledWith("zip", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledWith("zap", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledWith("zup", expect.any(Function));
        expect(target.registerFunction).toHaveBeenCalledTimes(3);
    });
});

describe("recursiveFind", () => {
    it("returns all files with existing files and no filter", () => {
        fs.writeFileSync(`./target/1.js`, "whatever");
        fs.writeFileSync(`./target/2.jsx`, "whatever");
        fs.writeFileSync(`./target/3.ts`, "whatever");
        fs.writeFileSync(`./target/4.tsx`, "whatever");

        const actual = recursiveFind("./target");

        expect(actual).toEqual(["target/1.js", "target/2.jsx", "target/3.ts", "target/4.tsx"]);
    });

    it("returns matching files with existing files and filter", () => {
        fs.writeFileSync(`./target/1.js`, "whatever");
        fs.writeFileSync(`./target/2.jsx`, "whatever");
        fs.writeFileSync(`./target/3.ts`, "whatever");
        fs.writeFileSync(`./target/4.tsx`, "whatever");

        const actual = recursiveFind("./target", it => it.endsWith(".jsx"));

        expect(actual).toEqual(["target/2.jsx"]);
    });

    it("returns matching files with existing recursive files and filter", () => {
        fs.writeFileSync(`./target/file.jsx`, "whatever");
        fs.writeFileSync(`./target/1/file.jsx`, "whatever");
        fs.writeFileSync(`./target/1/2/file.jsx`, "whatever");

        const actual = recursiveFind("./target", it => it.endsWith(".jsx"));

        expect(actual).toEqual(["target/1/2/file.jsx", "target/1/file.jsx", "target/file.jsx"]);
    });

    it("returns empty array with no existing files", () => {
        const actual = recursiveFind("./target");

        expect(actual).toEqual([]);
    });
});
