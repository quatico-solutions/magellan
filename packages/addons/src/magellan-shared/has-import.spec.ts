/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { hasImport } from "./has-import";

describe("hasImport", () => {
    it("should return true if the source file has Context import", () => {
        const sourceFile = ts.createSourceFile(
            "test.ts",
            `
                import { Context } from "@quatico/magellan-shared";
                `,
            ts.ScriptTarget.Latest,
            true
        );

        const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

        expect(result).toBe(true);
    });

    it("should return true if the source file has Context type import", () => {
        const sourceFile = ts.createSourceFile(
            "test.ts",
            `
                import { type Context } from "@quatico/magellan-shared";
                `,
            ts.ScriptTarget.Latest,
            true
        );

        const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

        expect(result).toBe(true);
    });

    it("should return true if the source file multiple valid type imports", () => {
        const sourceFile = ts.createSourceFile(
            "test.ts",
            `
                import { type Context, type Serialization } from "@quatico/magellan-shared";
                `,
            ts.ScriptTarget.Latest,
            true
        );

        const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

        expect(result).toBe(true);
    });

    it("should return true if the source file multiple valid imports", () => {
        const sourceFile = ts.createSourceFile(
            "test.ts",
            `
                import { Context, Serialization } from "@quatico/magellan-shared";
                `,
            ts.ScriptTarget.Latest,
            true
        );

        const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

        expect(result).toBe(true);
    });

    it("should return false if the source file doesn't have Context import", () => {
        const sourceFile = ts.createSourceFile(
            "test.ts",
            `
                import { something } from "@quatico/magellan-shared";
                `,
            ts.ScriptTarget.Latest,
            true
        );

        const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

        expect(result).toBe(false);
    });

    it("should return false if the source file imports Context from a different module", () => {
        // Create a source file with Context import from a different module
        const sourceFile = ts.createSourceFile(
            "test.ts",
            `
                import { type Context } from "@quatico/different-module";
                `,
            ts.ScriptTarget.Latest,
            true
        );

        const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

        expect(result).toBe(false);
    });
});
