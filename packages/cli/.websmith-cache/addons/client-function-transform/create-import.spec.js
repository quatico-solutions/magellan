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
const create_import_1 = require("./create-import");
describe("createImport", () => {
    let factory;
    beforeEach(() => {
        factory = typescript_1.default.factory;
    });
    describe("basic functionality", () => {
        it("should create a basic import declaration with named import", () => {
            const importName = "MyFunction";
            const modulePath = "./my-module";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            expect(typescript_1.default.isImportDeclaration(actual)).toBe(true);
            expect(actual.importClause).toBeDefined();
            expect(actual.importClause.namedBindings).toBeDefined();
            expect(typescript_1.default.isNamedImports(actual.importClause.namedBindings)).toBe(true);
            const namedImports = actual.importClause.namedBindings;
            expect(namedImports.elements).toHaveLength(1);
            expect(namedImports.elements[0].name.text).toBe(importName);
            expect(typescript_1.default.isStringLiteral(actual.moduleSpecifier)).toBe(true);
            expect(actual.moduleSpecifier.text).toBe(modulePath);
        });
        it("should create import declaration with typeOnly set to false by default", () => {
            const importName = "MyFunction";
            const modulePath = "./my-module";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            const namedImports = actual.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(false);
        });
    });
    describe("typeOnly parameter", () => {
        it("should create type-only import when typeOnly is true", () => {
            const importName = "MyInterface";
            const modulePath = "./types";
            const typeOnly = true;
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath, typeOnly);
            const namedImports = actual.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(true);
        });
        it("should create regular import when typeOnly is false", () => {
            const importName = "MyFunction";
            const modulePath = "./utils";
            const typeOnly = false;
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath, typeOnly);
            const namedImports = actual.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(false);
        });
        it("should create regular import when typeOnly is undefined", () => {
            const importName = "MyFunction";
            const modulePath = "./utils";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath, undefined);
            const namedImports = actual.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(false);
        });
    });
    describe("various import names and module paths", () => {
        it("should handle camelCase import names", () => {
            const importName = "myUtilFunction";
            const modulePath = "./utils";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            const namedImports = actual.importClause.namedBindings;
            expect(namedImports.elements[0].name.text).toBe(importName);
        });
        it("should handle PascalCase import names", () => {
            const importName = "MyComponent";
            const modulePath = "./components";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            const namedImports = actual.importClause.namedBindings;
            expect(namedImports.elements[0].name.text).toBe(importName);
        });
        it("should handle relative module paths", () => {
            const importName = "helper";
            const modulePath = "../utils/helper";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            expect(actual.moduleSpecifier.text).toBe(modulePath);
        });
        it("should handle absolute module paths", () => {
            const importName = "lodash";
            const modulePath = "lodash";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            expect(actual.moduleSpecifier.text).toBe(modulePath);
        });
        it("should handle scoped package names", () => {
            const importName = "Component";
            const modulePath = "@my-org/my-package";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            expect(actual.moduleSpecifier.text).toBe(modulePath);
        });
    });
    describe("generated code structure", () => {
        it("should generate import declaration with correct structure", () => {
            const importName = "TestFunction";
            const modulePath = "./test-module";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            // Check that the import clause is not type-only at the clause level
            expect(actual.importClause.isTypeOnly).toBe(false);
            // Check that there's no default import
            expect(actual.importClause.name).toBeUndefined();
            // Check that named imports exist
            expect(actual.importClause.namedBindings).toBeDefined();
            expect(typescript_1.default.isNamedImports(actual.importClause.namedBindings)).toBe(true);
            // Check import specifier details
            const namedImports = actual.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.propertyName).toBeUndefined(); // No aliasing
            expect(importSpecifier.name.text).toBe(importName);
        });
        it("should create valid TypeScript AST nodes", () => {
            const importName = "MyExport";
            const modulePath = "./my-export";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            // Verify all nodes are valid TypeScript AST nodes
            expect(actual.kind).toBe(typescript_1.default.SyntaxKind.ImportDeclaration);
            expect(actual.importClause.kind).toBe(typescript_1.default.SyntaxKind.ImportClause);
            expect(actual.importClause.namedBindings.kind).toBe(typescript_1.default.SyntaxKind.NamedImports);
            expect(actual.moduleSpecifier.kind).toBe(typescript_1.default.SyntaxKind.StringLiteral);
        });
    });
    describe("edge cases", () => {
        it("should handle empty import name", () => {
            const importName = "";
            const modulePath = "./module";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            const namedImports = actual.importClause.namedBindings;
            expect(namedImports.elements[0].name.text).toBe("");
        });
        it("should handle empty module path", () => {
            const importName = "MyFunction";
            const modulePath = "";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            expect(actual.moduleSpecifier.text).toBe("");
        });
        it("should handle special characters in import name", () => {
            const importName = "$specialFunction";
            const modulePath = "./special";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            const namedImports = actual.importClause.namedBindings;
            expect(namedImports.elements[0].name.text).toBe(importName);
        });
        it("should handle module paths with file extensions", () => {
            const importName = "MyFunction";
            const modulePath = "./my-module.js";
            const actual = (0, create_import_1.createImport)(factory, importName, modulePath);
            expect(actual.moduleSpecifier.text).toBe(modulePath);
        });
    });
});
