"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const typescript_1 = __importDefault(require("typescript"));
const has_import_1 = require("./has-import");
describe("hasImport", () => {
    it("should return true if the source file has Context import", () => {
        const sourceFile = typescript_1.default.createSourceFile("test.ts", `
                import { Context } from "@quatico/magellan-shared";
                `, typescript_1.default.ScriptTarget.Latest, true);
        const result = (0, has_import_1.hasImport)(sourceFile, "@quatico/magellan-shared", "Context");
        expect(result).toBe(true);
    });
    it("should return true if the source file has Context type import", () => {
        const sourceFile = typescript_1.default.createSourceFile("test.ts", `
                import { type Context } from "@quatico/magellan-shared";
                `, typescript_1.default.ScriptTarget.Latest, true);
        const result = (0, has_import_1.hasImport)(sourceFile, "@quatico/magellan-shared", "Context");
        expect(result).toBe(true);
    });
    it("should return true if the source file multiple valid type imports", () => {
        const sourceFile = typescript_1.default.createSourceFile("test.ts", `
                import { type Context, type Serialization } from "@quatico/magellan-shared";
                `, typescript_1.default.ScriptTarget.Latest, true);
        const result = (0, has_import_1.hasImport)(sourceFile, "@quatico/magellan-shared", "Context");
        expect(result).toBe(true);
    });
    it("should return true if the source file multiple valid imports", () => {
        const sourceFile = typescript_1.default.createSourceFile("test.ts", `
                import { Context, Serialization } from "@quatico/magellan-shared";
                `, typescript_1.default.ScriptTarget.Latest, true);
        const result = (0, has_import_1.hasImport)(sourceFile, "@quatico/magellan-shared", "Context");
        expect(result).toBe(true);
    });
    it("should return false if the source file doesn't have Context import", () => {
        const sourceFile = typescript_1.default.createSourceFile("test.ts", `
                import { something } from "@quatico/magellan-shared";
                `, typescript_1.default.ScriptTarget.Latest, true);
        const result = (0, has_import_1.hasImport)(sourceFile, "@quatico/magellan-shared", "Context");
        expect(result).toBe(false);
    });
    it("should return false if the source file imports Context from a different module", () => {
        // Create a source file with Context import from a different module
        const sourceFile = typescript_1.default.createSourceFile("test.ts", `
                import { type Context } from "@quatico/different-module";
                `, typescript_1.default.ScriptTarget.Latest, true);
        const result = (0, has_import_1.hasImport)(sourceFile, "@quatico/magellan-shared", "Context");
        expect(result).toBe(false);
    });
});
