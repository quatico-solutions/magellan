/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { createImport } from "./create-import";

describe("createImport", () => {
    let factory: ts.NodeFactory;

    beforeEach(() => {
        factory = ts.factory;
    });

    describe("basic functionality", () => {
        it("should create a basic import declaration with named import", () => {
            const importName = "MyFunction";
            const modulePath = "./my-module";

            const actual = createImport(factory, importName, modulePath);

            expect(ts.isImportDeclaration(actual)).toBe(true);
            expect(actual.importClause).toBeDefined();
            expect(actual.importClause!.namedBindings).toBeDefined();
            expect(ts.isNamedImports(actual.importClause!.namedBindings!)).toBe(true);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            expect(namedImports.elements).toHaveLength(1);
            expect(namedImports.elements[0].name.text).toBe(importName);

            expect(ts.isStringLiteral(actual.moduleSpecifier)).toBe(true);
            expect((actual.moduleSpecifier as ts.StringLiteral).text).toBe(modulePath);
        });

        it("should create import declaration with typeOnly set to false by default", () => {
            const importName = "MyFunction";
            const modulePath = "./my-module";

            const actual = createImport(factory, importName, modulePath);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(false);
        });
    });

    describe("typeOnly parameter", () => {
        it("should create type-only import when typeOnly is true", () => {
            const importName = "MyInterface";
            const modulePath = "./types";
            const typeOnly = true;

            const actual = createImport(factory, importName, modulePath, typeOnly);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(true);
        });

        it("should create regular import when typeOnly is false", () => {
            const importName = "MyFunction";
            const modulePath = "./utils";
            const typeOnly = false;

            const actual = createImport(factory, importName, modulePath, typeOnly);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(false);
        });

        it("should create regular import when typeOnly is undefined", () => {
            const importName = "MyFunction";
            const modulePath = "./utils";

            const actual = createImport(factory, importName, modulePath, undefined);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.isTypeOnly).toBe(false);
        });
    });

    describe("various import names and module paths", () => {
        it("should handle camelCase import names", () => {
            const importName = "myUtilFunction";
            const modulePath = "./utils";

            const actual = createImport(factory, importName, modulePath);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            expect(namedImports.elements[0].name.text).toBe(importName);
        });

        it("should handle PascalCase import names", () => {
            const importName = "MyComponent";
            const modulePath = "./components";

            const actual = createImport(factory, importName, modulePath);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            expect(namedImports.elements[0].name.text).toBe(importName);
        });

        it("should handle relative module paths", () => {
            const importName = "helper";
            const modulePath = "../utils/helper";

            const actual = createImport(factory, importName, modulePath);

            expect((actual.moduleSpecifier as ts.StringLiteral).text).toBe(modulePath);
        });

        it("should handle absolute module paths", () => {
            const importName = "lodash";
            const modulePath = "lodash";

            const actual = createImport(factory, importName, modulePath);

            expect((actual.moduleSpecifier as ts.StringLiteral).text).toBe(modulePath);
        });

        it("should handle scoped package names", () => {
            const importName = "Component";
            const modulePath = "@my-org/my-package";

            const actual = createImport(factory, importName, modulePath);

            expect((actual.moduleSpecifier as ts.StringLiteral).text).toBe(modulePath);
        });
    });

    describe("generated code structure", () => {
        it("should generate import declaration with correct structure", () => {
            const importName = "TestFunction";
            const modulePath = "./test-module";

            const actual = createImport(factory, importName, modulePath);

            // Check that the import clause is not type-only at the clause level
            expect(actual.importClause!.isTypeOnly).toBe(false);

            // Check that there's no default import
            expect(actual.importClause!.name).toBeUndefined();

            // Check that named imports exist
            expect(actual.importClause!.namedBindings).toBeDefined();
            expect(ts.isNamedImports(actual.importClause!.namedBindings!)).toBe(true);

            // Check import specifier details
            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.propertyName).toBeUndefined(); // No aliasing
            expect(importSpecifier.name.text).toBe(importName);
        });

        it("should create valid TypeScript AST nodes", () => {
            const importName = "MyExport";
            const modulePath = "./my-export";

            const actual = createImport(factory, importName, modulePath);

            // Verify all nodes are valid TypeScript AST nodes
            expect(actual.kind).toBe(ts.SyntaxKind.ImportDeclaration);
            expect(actual.importClause!.kind).toBe(ts.SyntaxKind.ImportClause);
            expect(actual.importClause!.namedBindings!.kind).toBe(ts.SyntaxKind.NamedImports);
            expect(actual.moduleSpecifier.kind).toBe(ts.SyntaxKind.StringLiteral);
        });
    });

    describe("edge cases", () => {
        it("should handle empty import name", () => {
            const importName = "";
            const modulePath = "./module";

            const actual = createImport(factory, importName, modulePath);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            expect(namedImports.elements[0].name.text).toBe("");
        });

        it("should handle empty module path", () => {
            const importName = "MyFunction";
            const modulePath = "";

            const actual = createImport(factory, importName, modulePath);

            expect((actual.moduleSpecifier as ts.StringLiteral).text).toBe("");
        });

        it("should handle special characters in import name", () => {
            const importName = "$specialFunction";
            const modulePath = "./special";

            const actual = createImport(factory, importName, modulePath);

            const namedImports = actual.importClause!.namedBindings as ts.NamedImports;
            expect(namedImports.elements[0].name.text).toBe(importName);
        });

        it("should handle module paths with file extensions", () => {
            const importName = "MyFunction";
            const modulePath = "./my-module.js";

            const actual = createImport(factory, importName, modulePath);

            expect((actual.moduleSpecifier as ts.StringLiteral).text).toBe(modulePath);
        });
    });
});
