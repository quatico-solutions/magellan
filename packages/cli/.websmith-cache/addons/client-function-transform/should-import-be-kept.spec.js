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
const should_import_be_kept_1 = require("./should-import-be-kept");
const constants_1 = require("../magellan-shared/parameters/constants");
const transformer_client_1 = require("./transformer-client");
describe("shouldImportBeKept", () => {
    let factory;
    beforeEach(() => {
        factory = typescript_1.default.factory;
    });
    // Helper function to create a source file with given code
    const createSourceFile = (code) => {
        return typescript_1.default.createSourceFile("test.ts", code, typescript_1.default.ScriptTarget.Latest, true);
    };
    // Helper function to create import declarations for testing
    const createImportDeclaration = (importName, modulePath, typeOnly = false) => {
        const importSpecifier = factory.createImportSpecifier(typeOnly, undefined, factory.createIdentifier(importName));
        return factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([importSpecifier])), factory.createStringLiteral(modulePath));
    };
    const createMultipleNamedImportsDeclaration = (importNames, modulePath) => {
        const importSpecifiers = importNames.map(name => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)));
        return factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)), factory.createStringLiteral(modulePath));
    };
    describe("non-import declarations", () => {
        it("should return false for non-ImportDeclaration nodes", () => {
            const variableStatement = factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
                factory.createVariableDeclaration("test", undefined, undefined, factory.createStringLiteral("value")),
            ]));
            const sourceFile = createSourceFile("const test = 'value';");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(variableStatement, sourceFile);
            expect(actual).toBe(false);
        });
        it("should return false for function declarations", () => {
            const functionDeclaration = factory.createFunctionDeclaration(undefined, undefined, "testFunction", undefined, [], undefined, factory.createBlock([]));
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(functionDeclaration);
            expect(actual).toBe(false);
        });
        it("should return false for class declarations", () => {
            const classDeclaration = factory.createClassDeclaration(undefined, "TestClass", undefined, undefined, []);
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(classDeclaration);
            expect(actual).toBe(false);
        });
    });
    describe("imports with non-string module specifiers", () => {
        it("should return false for imports with computed module specifiers", () => {
            // This is a synthetic test case - TypeScript normally doesn't allow this
            const importDecl = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier("test"))])), factory.createIdentifier("computedModulePath") // Not a string literal
            );
            const sourceFile = createSourceFile("const someCode = 'test';");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false);
        });
    });
    describe("imports that should be kept", () => {
        it("should return true for imports with names not handled by client transformer", () => {
            const importDecl = createImportDeclaration("customFunction", "./custom-module");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true for lodash imports", () => {
            const importDecl = createImportDeclaration("map", "lodash");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true for React imports", () => {
            const importDecl = createImportDeclaration("useState", "react");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true for custom utility imports", () => {
            const importDecl = createImportDeclaration("myUtility", "./utils/my-utility");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true for type imports that are not handled by client transformer", () => {
            const importDecl = createImportDeclaration("CustomType", "./types", true);
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
    });
    describe("imports that should NOT be kept (handled by client transformer)", () => {
        it("should return false for unused remoteInvoke imports", () => {
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME} } from "@quatico/magellan-client";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false);
        });
        it("should return false for unused Context type imports", () => {
            const code = `
                import { type ${constants_1.CONTEXT_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false);
        });
        it("should return false for unused Serialization type imports", () => {
            const code = `
                import { type ${constants_1.SERIALIZATION_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false);
        });
        it("should verify constant values match expected names", () => {
            // Verify our understanding of the constants is correct
            expect(transformer_client_1.REMOTE_INVOKE_PARAM_NAME).toBe("remoteInvoke");
            expect(constants_1.CONTEXT_TYPE_NAME).toBe("Context");
            expect(constants_1.SERIALIZATION_TYPE_NAME).toBe("Serialization");
        });
    });
    describe("mixed imports (some kept, some not)", () => {
        it("should return true when import contains both handled and unhandled names", () => {
            const importDecl = createMultipleNamedImportsDeclaration([transformer_client_1.REMOTE_INVOKE_PARAM_NAME, "customFunction"], "@quatico/magellan-client");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true when import contains Context and custom types", () => {
            const importDecl = createMultipleNamedImportsDeclaration([constants_1.CONTEXT_TYPE_NAME, "CustomType"], "@quatico/magellan-shared");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true when import contains Serialization and other utilities", () => {
            const importDecl = createMultipleNamedImportsDeclaration([constants_1.SERIALIZATION_TYPE_NAME, "helperFunction", "AnotherType"], "@quatico/magellan-shared");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return false when import contains only handled names", () => {
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME}, ${constants_1.CONTEXT_TYPE_NAME}, ${constants_1.SERIALIZATION_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false);
        });
    });
    describe("different import types", () => {
        it("should handle unused default imports", () => {
            const code = `
                import React from "react";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed because React is not used
        });
        it("should handle unused namespace imports", () => {
            const code = `
                import * as ts from "typescript";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed because ts is not used
        });
        it("should keep side-effect imports (no import clause)", () => {
            const importDecl = factory.createImportDeclaration(undefined, undefined, // No import clause
            factory.createStringLiteral("side-effect-module"));
            const sourceFile = createSourceFile('import "side-effect-module";');
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Side-effect imports should always be kept
        });
        it("should handle default imports without named bindings when no source file", () => {
            const importDecl = factory.createImportDeclaration(undefined, factory.createImportClause(false, factory.createIdentifier("defaultImport"), undefined), factory.createStringLiteral("some-module"));
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl); // No source file
            expect(actual).toBe(true); // Should be kept when no source file is provided (fallback)
        });
    });
    describe("edge cases", () => {
        it("should return false for empty named imports list", () => {
            const code = `
                import { } from "empty-module";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // No elements means no imports to check
        });
        it("should return true for imports with special characters in names", () => {
            const importDecl = createImportDeclaration("$specialFunction", "./special");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should return true for imports with numbers in names", () => {
            const importDecl = createImportDeclaration("function2", "./numbered");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(actual).toBe(true);
        });
        it("should handle imports from different module paths correctly", () => {
            // Same name as handled import but different module path should NOT be kept
            // This prevents naming conflicts since createClientImports will add the official import
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME} } from "./custom-remote-invoke";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false);
        });
    });
    describe("real-world scenarios", () => {
        it("should keep imports for third-party libraries", () => {
            const scenarios = [
                createImportDeclaration("axios", "axios"),
                createImportDeclaration("Component", "@angular/core"),
                createImportDeclaration("Observable", "rxjs"),
                createImportDeclaration("map", "lodash/map"),
            ];
            scenarios.forEach(importDecl => {
                expect((0, should_import_be_kept_1.shouldImportBeKept)(importDecl)).toBe(true);
            });
        });
        it("should keep imports for local modules", () => {
            const scenarios = [
                createImportDeclaration("BusinessLogic", "./business-logic"),
                createImportDeclaration("ApiService", "../services/api"),
                createImportDeclaration("Constants", "../../constants"),
                createImportDeclaration("Utils", "@/utils"),
            ];
            scenarios.forEach(importDecl => {
                expect((0, should_import_be_kept_1.shouldImportBeKept)(importDecl)).toBe(true);
            });
        });
        it("should not keep unused imports that will be added by client transformer", () => {
            const testCases = [
                { name: "remoteInvoke", module: "@quatico/magellan-client", typeOnly: false },
                { name: "Context", module: "@quatico/magellan-shared", typeOnly: true },
                { name: "Serialization", module: "@quatico/magellan-shared", typeOnly: true },
            ];
            testCases.forEach(testCase => {
                const typePrefix = testCase.typeOnly ? "type " : "";
                const code = `
                    import { ${typePrefix}${testCase.name} } from "${testCase.module}";
                    
                    const someCode = "test";
                `;
                const sourceFile = createSourceFile(code);
                const importDecl = sourceFile.statements[0];
                expect((0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile)).toBe(false);
            });
        });
    });
    describe("external imports from node_modules", () => {
        it("should keep used Node.js built-in imports", () => {
            const code = `
                import path from "path";
                import fs from "fs";
                
                const filePath = path.join(__dirname, "test.txt");
                const content = fs.readFileSync(filePath, "utf8");
            `;
            const sourceFile = createSourceFile(code);
            const pathImport = sourceFile.statements[0];
            const fsImport = sourceFile.statements[1];
            const pathResult = (0, should_import_be_kept_1.shouldImportBeKept)(pathImport, sourceFile);
            const fsResult = (0, should_import_be_kept_1.shouldImportBeKept)(fsImport, sourceFile);
            expect(pathResult).toBe(true); // Should be kept because path is used
            expect(fsResult).toBe(true); // Should be kept because fs is used
        });
        it("should remove unused Node.js built-in imports", () => {
            const code = `
                import path from "path";
                import fs from "fs";
                import os from "os";
                
                const filePath = path.join(__dirname, "test.txt");
                // fs and os are not used
            `;
            const sourceFile = createSourceFile(code);
            const pathImport = sourceFile.statements[0];
            const fsImport = sourceFile.statements[1];
            const osImport = sourceFile.statements[2];
            const pathResult = (0, should_import_be_kept_1.shouldImportBeKept)(pathImport, sourceFile);
            const fsResult = (0, should_import_be_kept_1.shouldImportBeKept)(fsImport, sourceFile);
            const osResult = (0, should_import_be_kept_1.shouldImportBeKept)(osImport, sourceFile);
            expect(pathResult).toBe(true); // Should be kept because path is used
            expect(fsResult).toBe(false); // Should be removed because fs is not used
            expect(osResult).toBe(false); // Should be removed because os is not used
        });
        it("should keep used npm package imports", () => {
            const code = `
                import lodash from "lodash";
                import axios from "axios";
                import { v4 as uuid } from "uuid";
                
                const data = lodash.map([1, 2, 3], x => x * 2);
                const id = uuid();
                // axios is not used
            `;
            const sourceFile = createSourceFile(code);
            const lodashImport = sourceFile.statements[0];
            const axiosImport = sourceFile.statements[1];
            const uuidImport = sourceFile.statements[2];
            const lodashResult = (0, should_import_be_kept_1.shouldImportBeKept)(lodashImport, sourceFile);
            const axiosResult = (0, should_import_be_kept_1.shouldImportBeKept)(axiosImport, sourceFile);
            const uuidResult = (0, should_import_be_kept_1.shouldImportBeKept)(uuidImport, sourceFile);
            expect(lodashResult).toBe(true); // Should be kept because lodash is used
            expect(axiosResult).toBe(false); // Should be removed because axios is not used
            expect(uuidResult).toBe(true); // Should be kept because uuid is used
        });
        it("should keep used type-only imports from @types packages", () => {
            const code = `
                import { type IncomingMessage } from "http";
                import { type Express } from "express";
                import { type NodeJS } from "@types/node";
                
                const handler = (req: IncomingMessage, app: Express) => {
                    // NodeJS type is not used
                };
            `;
            const sourceFile = createSourceFile(code);
            const httpImport = sourceFile.statements[0];
            const expressImport = sourceFile.statements[1];
            const nodeImport = sourceFile.statements[2];
            const httpResult = (0, should_import_be_kept_1.shouldImportBeKept)(httpImport, sourceFile);
            const expressResult = (0, should_import_be_kept_1.shouldImportBeKept)(expressImport, sourceFile);
            const nodeResult = (0, should_import_be_kept_1.shouldImportBeKept)(nodeImport, sourceFile);
            expect(httpResult).toBe(true); // Should be kept because IncomingMessage is used
            expect(expressResult).toBe(true); // Should be kept because Express is used
            expect(nodeResult).toBe(false); // Should be removed because NodeJS is not used
        });
        it("should handle mixed named imports from external packages", () => {
            const code = `
                import { readFile, writeFile, existsSync } from "fs";
                import { join, resolve, dirname, basename } from "path";
                
                const filePath = join(__dirname, "test.txt");
                const exists = existsSync(filePath);
                const dir = dirname(filePath);
                // readFile, writeFile, resolve, basename are not used
            `;
            const sourceFile = createSourceFile(code);
            const fsImport = sourceFile.statements[0];
            const pathImport = sourceFile.statements[1];
            const fsResult = (0, should_import_be_kept_1.shouldImportBeKept)(fsImport, sourceFile);
            const pathResult = (0, should_import_be_kept_1.shouldImportBeKept)(pathImport, sourceFile);
            expect(fsResult).toBe(true); // Should be kept because existsSync is used (partial usage)
            expect(pathResult).toBe(true); // Should be kept because join and dirname are used (partial usage)
        });
        it("should remove completely unused external package imports", () => {
            const code = `
                import moment from "moment";
                import chalk from "chalk";
                import { debounce } from "lodash";
                
                const someCode = "test";
                // None of the imports are used
            `;
            const sourceFile = createSourceFile(code);
            const momentImport = sourceFile.statements[0];
            const chalkImport = sourceFile.statements[1];
            const lodashImport = sourceFile.statements[2];
            const momentResult = (0, should_import_be_kept_1.shouldImportBeKept)(momentImport, sourceFile);
            const chalkResult = (0, should_import_be_kept_1.shouldImportBeKept)(chalkImport, sourceFile);
            const lodashResult = (0, should_import_be_kept_1.shouldImportBeKept)(lodashImport, sourceFile);
            expect(momentResult).toBe(false); // Should be removed because moment is not used
            expect(chalkResult).toBe(false); // Should be removed because chalk is not used
            expect(lodashResult).toBe(false); // Should be removed because debounce is not used
        });
        it("should handle scoped package imports correctly", () => {
            const code = `
                import { Component } from "@angular/core";
                import { Observable } from "@rxjs/core";
                import { Logger } from "@nestjs/common";
                
                const component = new Component();
                // Observable and Logger are not used
            `;
            const sourceFile = createSourceFile(code);
            const angularImport = sourceFile.statements[0];
            const rxjsImport = sourceFile.statements[1];
            const nestjsImport = sourceFile.statements[2];
            const angularResult = (0, should_import_be_kept_1.shouldImportBeKept)(angularImport, sourceFile);
            const rxjsResult = (0, should_import_be_kept_1.shouldImportBeKept)(rxjsImport, sourceFile);
            const nestjsResult = (0, should_import_be_kept_1.shouldImportBeKept)(nestjsImport, sourceFile);
            expect(angularResult).toBe(true); // Should be kept because Component is used
            expect(rxjsResult).toBe(false); // Should be removed because Observable is not used
            expect(nestjsResult).toBe(false); // Should be removed because Logger is not used
        });
        it("should handle namespace imports from external packages", () => {
            const code = `
                import * as fs from "fs";
                import * as path from "path";
                import * as crypto from "crypto";
                
                const filePath = path.join(__dirname, "test.txt");
                const hash = crypto.createHash("md5");
                // fs namespace is not used
            `;
            const sourceFile = createSourceFile(code);
            const fsImport = sourceFile.statements[0];
            const pathImport = sourceFile.statements[1];
            const cryptoImport = sourceFile.statements[2];
            const fsResult = (0, should_import_be_kept_1.shouldImportBeKept)(fsImport, sourceFile);
            const pathResult = (0, should_import_be_kept_1.shouldImportBeKept)(pathImport, sourceFile);
            const cryptoResult = (0, should_import_be_kept_1.shouldImportBeKept)(cryptoImport, sourceFile);
            expect(fsResult).toBe(false); // Should be removed because fs is not used
            expect(pathResult).toBe(true); // Should be kept because path is used
            expect(cryptoResult).toBe(true); // Should be kept because crypto is used
        });
        it("should distinguish between external and internal imports", () => {
            const code = `
                import fs from "fs"; // external - Node.js built-in
                import axios from "axios"; // external - npm package
                import { myUtil } from "./utils"; // internal - local file
                import { MyType } from "../types"; // internal - local file
                
                const data = fs.readFileSync("test.txt");
                const result = myUtil(data);
                // axios and MyType are not used
            `;
            const sourceFile = createSourceFile(code);
            const fsImport = sourceFile.statements[0];
            const axiosImport = sourceFile.statements[1];
            const utilImport = sourceFile.statements[2];
            const typeImport = sourceFile.statements[3];
            const fsResult = (0, should_import_be_kept_1.shouldImportBeKept)(fsImport, sourceFile);
            const axiosResult = (0, should_import_be_kept_1.shouldImportBeKept)(axiosImport, sourceFile);
            const utilResult = (0, should_import_be_kept_1.shouldImportBeKept)(utilImport, sourceFile);
            const typeResult = (0, should_import_be_kept_1.shouldImportBeKept)(typeImport, sourceFile);
            expect(fsResult).toBe(true); // Should be kept because fs is used
            expect(axiosResult).toBe(false); // Should be removed because axios is not used
            expect(utilResult).toBe(true); // Should be kept because myUtil is used
            expect(typeResult).toBe(false); // Should be removed because MyType is not used
        });
    });
    describe("actual unused import detection", () => {
        it("should detect truly unused imports", () => {
            const code = `
                import { unusedFunction, usedFunction } from "./utils";
                import { UnusedType, UsedType } from "./types";
                
                const result = usedFunction("test");
                const variable: UsedType = { value: "test" };
            `;
            const sourceFile = createSourceFile(code);
            const importDecl1 = sourceFile.statements[0];
            const importDecl2 = sourceFile.statements[1];
            const actual1 = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl1, sourceFile);
            const actual2 = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl2, sourceFile);
            expect(actual1).toBe(true); // Should be kept because usedFunction is used
            expect(actual2).toBe(true); // Should be kept because UsedType is used
        });
        it("should remove completely unused imports", () => {
            const code = `
                import { completelyUnused } from "./unused-module";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed because completelyUnused is never used
        });
        it("should keep imports used in type annotations", () => {
            const code = `
                import { MyType } from "./types";
                
                const variable: MyType = { value: "test" };
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Should be kept because MyType is used in type annotation
        });
        it("should keep imports used in function calls", () => {
            const code = `
                import { helperFunction } from "./helpers";
                
                const result = helperFunction("test");
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Should be kept because helperFunction is called
        });
        it("should handle mixed used and unused imports", () => {
            const code = `
                import { used, unused, alsoUsed } from "./mixed";
                
                const result = used(alsoUsed("test"));
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Should be kept because some imports (used, alsoUsed) are used
        });
        it("should keep side-effect imports", () => {
            const code = `
                import "./side-effects";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Should be kept because side-effect imports are always kept
        });
        it("should keep default imports when used", () => {
            const code = `
                import React from "react";
                
                const element = React.createElement("div");
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Should be kept because React is used
        });
        it("should remove default imports when unused", () => {
            const code = `
                import UnusedDefault from "unused-module";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed because UnusedDefault is never used
        });
        it("should keep namespace imports when used", () => {
            const code = `
                import * as Utils from "./utils";
                
                const result = Utils.helperFunction("test");
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(true); // Should be kept because Utils is used
        });
        it("should handle imports without source file (fallback behavior)", () => {
            const importDecl = createImportDeclaration("someFunction", "./some-module");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl); // No source file provided
            expect(actual).toBe(true); // Should be kept when source file is not provided
        });
    });
    describe("redundant import removal", () => {
        it("should remove unused remoteInvoke imports from official package", () => {
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME} } from "@quatico/magellan-client";
                
                const someOtherCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed as unused since createClientImports will add it
        });
        it("should remove unused Context type imports from official package", () => {
            const code = `
                import { type ${constants_1.CONTEXT_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someOtherCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed as unused since createClientImports will add it
        });
        it("should remove unused Serialization type imports from official package", () => {
            const code = `
                import { type ${constants_1.SERIALIZATION_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someOtherCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed as unused since createClientImports will add it
        });
        it("should remove unused imports even when mixed with used imports", () => {
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME}, ${constants_1.CONTEXT_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someOtherCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // Should be removed since all imports are unused/redundant
        });
        it("should remove imports with unused names from any module path", () => {
            // Even if imported from a different path, unused names should be removed to prevent conflicts
            const testCases = [
                { name: transformer_client_1.REMOTE_INVOKE_PARAM_NAME, path: "./local-remote-invoke" },
                { name: constants_1.CONTEXT_TYPE_NAME, path: "../types/context" },
                { name: constants_1.SERIALIZATION_TYPE_NAME, path: "../../shared/serialization" },
                { name: transformer_client_1.REMOTE_INVOKE_PARAM_NAME, path: "custom-magellan-client" },
            ];
            testCases.forEach(testCase => {
                const code = `
                    import { ${testCase.name} } from "${testCase.path}";
                    
                    const someOtherCode = "test";
                `;
                const sourceFile = createSourceFile(code);
                const importDecl = sourceFile.statements[0];
                const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
                expect(actual).toBe(false); // All should be removed to prevent naming conflicts
            });
        });
        it("should identify complex unused import scenarios", () => {
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME}, ${constants_1.CONTEXT_TYPE_NAME}, ${constants_1.SERIALIZATION_TYPE_NAME} } from "@quatico/magellan-shared";
                
                const someOtherCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
            expect(actual).toBe(false); // All imports are unused, so the entire import should be removed
        });
        it("should preserve imports when only some are unused", () => {
            // Mixed scenario: some unused, some used
            const mixedImport = createMultipleNamedImportsDeclaration([transformer_client_1.REMOTE_INVOKE_PARAM_NAME, "customUtility", constants_1.CONTEXT_TYPE_NAME, "AnotherType"], "@quatico/magellan-shared");
            const actual = (0, should_import_be_kept_1.shouldImportBeKept)(mixedImport);
            expect(actual).toBe(true); // Should be kept because it contains used imports (customUtility, AnotherType)
        });
        it("should handle unused imports with different casing", () => {
            // Test that exact name matching is used (case-sensitive)
            const differentCasingImports = [
                createImportDeclaration("remoteinvoke", "@quatico/magellan-client"), // lowercase
                createImportDeclaration("REMOTEINVOKE", "@quatico/magellan-client"), // uppercase
                createImportDeclaration("RemoteInvoke", "@quatico/magellan-client"), // PascalCase
                createImportDeclaration("context", "@quatico/magellan-shared", true), // lowercase
                createImportDeclaration("CONTEXT", "@quatico/magellan-shared", true), // uppercase
            ];
            differentCasingImports.forEach(importDecl => {
                const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
                expect(actual).toBe(true); // Should be kept because names don't match exactly
            });
        });
        it("should remove unused imports regardless of import type (regular vs type-only)", () => {
            const testCases = [
                { name: transformer_client_1.REMOTE_INVOKE_PARAM_NAME, module: "@quatico/magellan-client", typeOnly: false },
                { name: constants_1.CONTEXT_TYPE_NAME, module: "@quatico/magellan-shared", typeOnly: false },
                { name: constants_1.SERIALIZATION_TYPE_NAME, module: "@quatico/magellan-shared", typeOnly: false },
                { name: transformer_client_1.REMOTE_INVOKE_PARAM_NAME, module: "@quatico/magellan-client", typeOnly: true },
                { name: constants_1.CONTEXT_TYPE_NAME, module: "@quatico/magellan-shared", typeOnly: true },
                { name: constants_1.SERIALIZATION_TYPE_NAME, module: "@quatico/magellan-shared", typeOnly: true },
            ];
            testCases.forEach(testCase => {
                const typePrefix = testCase.typeOnly ? "type " : "";
                const code = `
                    import { ${typePrefix}${testCase.name} } from "${testCase.module}";
                    
                    const someOtherCode = "test";
                `;
                const sourceFile = createSourceFile(code);
                const importDecl = sourceFile.statements[0];
                const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
                expect(actual).toBe(false); // All should be removed regardless of import type
            });
        });
        it("should handle unused imports from scoped packages", () => {
            const testCases = [
                { name: transformer_client_1.REMOTE_INVOKE_PARAM_NAME, module: "@other-org/magellan-client" },
                { name: constants_1.CONTEXT_TYPE_NAME, module: "@custom/magellan-shared" },
                { name: constants_1.SERIALIZATION_TYPE_NAME, module: "@my-company/shared" },
            ];
            testCases.forEach(testCase => {
                const code = `
                    import { ${testCase.name} } from "${testCase.module}";
                    
                    const someOtherCode = "test";
                `;
                const sourceFile = createSourceFile(code);
                const importDecl = sourceFile.statements[0];
                const actual = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile);
                expect(actual).toBe(false); // Should be removed due to name conflicts, regardless of package scope
            });
        });
    });
    describe("function behavior consistency", () => {
        it("should return consistent results for the same input", () => {
            const importDecl = createImportDeclaration("testFunction", "./test");
            const result1 = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            const result2 = (0, should_import_be_kept_1.shouldImportBeKept)(importDecl);
            expect(result1).toBe(result2);
            expect(result1).toBe(true);
        });
        it("should handle the same import declaration multiple times", () => {
            const code = `
                import { ${transformer_client_1.REMOTE_INVOKE_PARAM_NAME} } from "@quatico/magellan-client";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const importDecl = sourceFile.statements[0];
            const results = Array.from({ length: 5 }, () => (0, should_import_be_kept_1.shouldImportBeKept)(importDecl, sourceFile));
            expect(results.every(result => result === false)).toBe(true);
        });
    });
});
