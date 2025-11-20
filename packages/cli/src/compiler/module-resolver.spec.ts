/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import path from "path";
import { ModuleResolver } from "./module-resolver";

describe("ModuleResolver", () => {
    describe("resolveAddonsDir", () => {
        it("should resolve user-provided relative path as file system path", () => {
            const relativePath = "./custom/addons";

            const actual = ModuleResolver.resolveAddonsDir(relativePath);

            // Should resolve relative to cwd, not use require.resolve
            expect(actual).toBe(path.resolve(relativePath));
        });

        it("should resolve user-provided absolute path directly", () => {
            const absolutePath = "/absolute/path/to/addons";

            const actual = ModuleResolver.resolveAddonsDir(absolutePath);

            expect(actual).toBe(absolutePath);
        });

        it("should resolve complex relative path with parent directories", () => {
            const complexPath = "../../node_modules/.pnpm/@quatico+magellan-addons@0.18.0/lib";

            const actual = ModuleResolver.resolveAddonsDir(complexPath);

            // Should resolve relative to cwd
            expect(actual).toBe(path.resolve(complexPath));
        });

        it("should resolve path with special characters", () => {
            const pathWithSpecialChars = "./addons-dir_v1.0";

            const actual = ModuleResolver.resolveAddonsDir(pathWithSpecialChars);

            expect(actual).toBe(path.resolve(pathWithSpecialChars));
        });

        it("should use default resolution when no addonsDir is provided", () => {
            const actual = ModuleResolver.resolveAddonsDir();

            // Should either resolve from @quatico/magellan-addons package or fallback
            expect(actual).toBeDefined();
            expect(typeof actual).toBe("string");
            expect(path.isAbsolute(actual)).toBe(true);
        });

        it("should use default resolution when addonsDir is undefined", () => {
            const actual = ModuleResolver.resolveAddonsDir(undefined);

            expect(actual).toBeDefined();
            expect(path.isAbsolute(actual)).toBe(true);
        });

        it("should use default resolution when addonsDir is empty string", () => {
            // Empty string is falsy, so it should use default resolution
            const actual = ModuleResolver.resolveAddonsDir("");

            expect(actual).toBeDefined();
            expect(path.isAbsolute(actual)).toBe(true);
        });
    });

    describe("resolve", () => {
        it("should resolve a Node.js module path", () => {
            const actual = ModuleResolver.resolve("path");

            expect(actual).toBeDefined();
            expect(typeof actual).toBe("string");
        });

        it("should throw for non-existent module", () => {
            expect(() => {
                ModuleResolver.resolve("non-existent-module-xyz");
            }).toThrow();
        });
    });

    describe("resolveRelative", () => {
        it("should resolve a path relative to a module", () => {
            const actual = ModuleResolver.resolveRelative("path", "..");

            expect(actual).toBeDefined();
            expect(path.isAbsolute(actual)).toBe(true);
        });
    });
});
