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
const create_client_imports_1 = require("./create-client-imports");
const magellan_shared_1 = require("../magellan-shared");
const transformer_client_1 = require("./transformer-client");
describe("createClientImports", () => {
    let factory;
    beforeEach(() => {
        factory = typescript_1.default.factory;
    });
    describe("basic functionality", () => {
        it("should create exactly three import declarations", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            expect(actual).toHaveLength(3);
            expect(actual.every(typescript_1.default.isImportDeclaration)).toBe(true);
        });
        it("should create all imports as named imports", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            actual.forEach(importDecl => {
                expect(importDecl.importClause).toBeDefined();
                expect(importDecl.importClause.namedBindings).toBeDefined();
                expect(typescript_1.default.isNamedImports(importDecl.importClause.namedBindings)).toBe(true);
                const namedImports = importDecl.importClause.namedBindings;
                expect(namedImports.elements).toHaveLength(1);
            });
        });
        it("should not create default imports", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            actual.forEach(importDecl => {
                expect(importDecl.importClause.name).toBeUndefined();
            });
        });
    });
    describe("remoteInvoke import", () => {
        it("should create remoteInvoke import from @quatico/magellan-client", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const remoteInvokeImport = actual[0];
            expect(typescript_1.default.isStringLiteral(remoteInvokeImport.moduleSpecifier)).toBe(true);
            expect(remoteInvokeImport.moduleSpecifier.text).toBe("@quatico/magellan-client");
            const namedImports = remoteInvokeImport.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe(transformer_client_1.REMOTE_INVOKE_PARAM_NAME);
            expect(importSpecifier.isTypeOnly).toBe(false);
        });
        it("should use the correct constant for remoteInvoke name", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const remoteInvokeImport = actual[0];
            const namedImports = remoteInvokeImport.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe("remoteInvoke");
        });
    });
    describe("Context type import", () => {
        it("should create Context type import from @quatico/magellan-shared", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const contextImport = actual[1];
            expect(typescript_1.default.isStringLiteral(contextImport.moduleSpecifier)).toBe(true);
            expect(contextImport.moduleSpecifier.text).toBe("@quatico/magellan-shared");
            const namedImports = contextImport.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe(magellan_shared_1.CONTEXT_TYPE_NAME);
            expect(importSpecifier.isTypeOnly).toBe(true);
        });
        it("should use the correct constant for Context name", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const contextImport = actual[1];
            const namedImports = contextImport.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe("Context");
        });
    });
    describe("Serialization type import", () => {
        it("should create Serialization type import from @quatico/magellan-shared", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const serializationImport = actual[2];
            expect(typescript_1.default.isStringLiteral(serializationImport.moduleSpecifier)).toBe(true);
            expect(serializationImport.moduleSpecifier.text).toBe("@quatico/magellan-shared");
            const namedImports = serializationImport.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe(magellan_shared_1.SERIALIZATION_TYPE_NAME);
            expect(importSpecifier.isTypeOnly).toBe(true);
        });
        it("should use the correct constant for Serialization name", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const serializationImport = actual[2];
            const namedImports = serializationImport.importClause.namedBindings;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe("Serialization");
        });
    });
    describe("import order and structure", () => {
        it("should create imports in the correct order", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            // First: remoteInvoke from @quatico/magellan-client
            const remoteInvokeImport = actual[0];
            const remoteInvokeModulePath = remoteInvokeImport.moduleSpecifier.text;
            const remoteInvokeNamedImports = remoteInvokeImport.importClause.namedBindings;
            const remoteInvokeName = remoteInvokeNamedImports.elements[0].name.text;
            const remoteInvokeTypeOnly = remoteInvokeNamedImports.elements[0].isTypeOnly;
            expect(remoteInvokeModulePath).toBe("@quatico/magellan-client");
            expect(remoteInvokeName).toBe("remoteInvoke");
            expect(remoteInvokeTypeOnly).toBe(false);
            // Second: Context from @quatico/magellan-shared (type-only)
            const contextImport = actual[1];
            const contextModulePath = contextImport.moduleSpecifier.text;
            const contextNamedImports = contextImport.importClause.namedBindings;
            const contextName = contextNamedImports.elements[0].name.text;
            const contextTypeOnly = contextNamedImports.elements[0].isTypeOnly;
            expect(contextModulePath).toBe("@quatico/magellan-shared");
            expect(contextName).toBe("Context");
            expect(contextTypeOnly).toBe(true);
            // Third: Serialization from @quatico/magellan-shared (type-only)
            const serializationImport = actual[2];
            const serializationModulePath = serializationImport.moduleSpecifier.text;
            const serializationNamedImports = serializationImport.importClause.namedBindings;
            const serializationName = serializationNamedImports.elements[0].name.text;
            const serializationTypeOnly = serializationNamedImports.elements[0].isTypeOnly;
            expect(serializationModulePath).toBe("@quatico/magellan-shared");
            expect(serializationName).toBe("Serialization");
            expect(serializationTypeOnly).toBe(true);
        });
        it("should have exactly one runtime import and two type imports", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            const runtimeImports = actual.filter(importDecl => {
                const namedImports = importDecl.importClause.namedBindings;
                return !namedImports.elements[0].isTypeOnly;
            });
            const typeImports = actual.filter(importDecl => {
                const namedImports = importDecl.importClause.namedBindings;
                return namedImports.elements[0].isTypeOnly;
            });
            expect(runtimeImports).toHaveLength(1);
            expect(typeImports).toHaveLength(2);
        });
    });
    describe("generated AST structure", () => {
        it("should generate valid TypeScript AST nodes", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            actual.forEach(importDecl => {
                expect(importDecl.kind).toBe(typescript_1.default.SyntaxKind.ImportDeclaration);
                expect(importDecl.importClause.kind).toBe(typescript_1.default.SyntaxKind.ImportClause);
                expect(importDecl.importClause.namedBindings.kind).toBe(typescript_1.default.SyntaxKind.NamedImports);
                expect(importDecl.moduleSpecifier.kind).toBe(typescript_1.default.SyntaxKind.StringLiteral);
            });
        });
        it("should create import clauses that are not type-only at the clause level", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            actual.forEach(importDecl => {
                expect(importDecl.importClause.isTypeOnly).toBe(false);
            });
        });
        it("should create import specifiers without property names (no aliasing)", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            actual.forEach(importDecl => {
                const namedImports = importDecl.importClause.namedBindings;
                const importSpecifier = namedImports.elements[0];
                expect(importSpecifier.propertyName).toBeUndefined();
            });
        });
    });
    describe("consistency with constants", () => {
        it("should use imported constants for all names", () => {
            const actual = (0, create_client_imports_1.createClientImports)(factory);
            // Check that the function uses the actual constant values
            const remoteInvokeImport = actual[0];
            const contextImport = actual[1];
            const serializationImport = actual[2];
            const remoteInvokeNamedImports = remoteInvokeImport.importClause.namedBindings;
            const contextNamedImports = contextImport.importClause.namedBindings;
            const serializationNamedImports = serializationImport.importClause.namedBindings;
            expect(remoteInvokeNamedImports.elements[0].name.text).toBe(transformer_client_1.REMOTE_INVOKE_PARAM_NAME);
            expect(contextNamedImports.elements[0].name.text).toBe(magellan_shared_1.CONTEXT_TYPE_NAME);
            expect(serializationNamedImports.elements[0].name.text).toBe(magellan_shared_1.SERIALIZATION_TYPE_NAME);
        });
        it("should match expected constant values", () => {
            // Verify our understanding of the constants is correct
            expect(transformer_client_1.REMOTE_INVOKE_PARAM_NAME).toBe("remoteInvoke");
            expect(magellan_shared_1.CONTEXT_TYPE_NAME).toBe("Context");
            expect(magellan_shared_1.SERIALIZATION_TYPE_NAME).toBe("Serialization");
        });
    });
    describe("function behavior", () => {
        it("should return a new array each time it's called", () => {
            const actual1 = (0, create_client_imports_1.createClientImports)(factory);
            const actual2 = (0, create_client_imports_1.createClientImports)(factory);
            expect(actual1).not.toBe(actual2);
            expect(actual1).toEqual(actual2);
        });
        it("should work with different factory instances", () => {
            const factory1 = typescript_1.default.factory;
            const factory2 = typescript_1.default.factory;
            const actual1 = (0, create_client_imports_1.createClientImports)(factory1);
            const actual2 = (0, create_client_imports_1.createClientImports)(factory2);
            expect(actual1).toHaveLength(3);
            expect(actual2).toHaveLength(3);
            // Should have same structure even with different factories
            actual1.forEach((importDecl, index) => {
                const otherImportDecl = actual2[index];
                const modulePath1 = importDecl.moduleSpecifier.text;
                const modulePath2 = otherImportDecl.moduleSpecifier.text;
                expect(modulePath1).toBe(modulePath2);
            });
        });
    });
});
