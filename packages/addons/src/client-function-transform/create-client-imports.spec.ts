/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { createClientImports } from "./create-client-imports";
import { CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME } from "../magellan-shared";
import { REMOTE_INVOKE_PARAM_NAME } from "./transformer-client";

describe("createClientImports", () => {
    let factory: ts.NodeFactory;

    beforeEach(() => {
        factory = ts.factory;
    });

    describe("basic functionality", () => {
        it("should create exactly three import declarations", () => {
            const actual = createClientImports(factory);

            expect(actual).toHaveLength(3);
            expect(actual.every(ts.isImportDeclaration)).toBe(true);
        });

        it("should create all imports as named imports", () => {
            const actual = createClientImports(factory);

            actual.forEach(importDecl => {
                expect(importDecl.importClause).toBeDefined();
                expect(importDecl.importClause!.namedBindings).toBeDefined();
                expect(ts.isNamedImports(importDecl.importClause!.namedBindings!)).toBe(true);

                const namedImports = importDecl.importClause!.namedBindings as ts.NamedImports;
                expect(namedImports.elements).toHaveLength(1);
            });
        });

        it("should not create default imports", () => {
            const actual = createClientImports(factory);

            actual.forEach(importDecl => {
                expect(importDecl.importClause!.name).toBeUndefined();
            });
        });
    });

    describe("remoteInvoke import", () => {
        it("should create remoteInvoke import from @quatico/magellan-client", () => {
            const actual = createClientImports(factory);
            const remoteInvokeImport = actual[0];

            expect(ts.isStringLiteral(remoteInvokeImport.moduleSpecifier)).toBe(true);
            expect((remoteInvokeImport.moduleSpecifier as ts.StringLiteral).text).toBe("@quatico/magellan-client");

            const namedImports = remoteInvokeImport.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe(REMOTE_INVOKE_PARAM_NAME);
            expect(importSpecifier.isTypeOnly).toBe(false);
        });

        it("should use the correct constant for remoteInvoke name", () => {
            const actual = createClientImports(factory);
            const remoteInvokeImport = actual[0];

            const namedImports = remoteInvokeImport.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe("remoteInvoke");
        });
    });

    describe("Context type import", () => {
        it("should create Context type import from @quatico/magellan-shared", () => {
            const actual = createClientImports(factory);
            const contextImport = actual[1];

            expect(ts.isStringLiteral(contextImport.moduleSpecifier)).toBe(true);
            expect((contextImport.moduleSpecifier as ts.StringLiteral).text).toBe("@quatico/magellan-shared");

            const namedImports = contextImport.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe(CONTEXT_TYPE_NAME);
            expect(importSpecifier.isTypeOnly).toBe(true);
        });

        it("should use the correct constant for Context name", () => {
            const actual = createClientImports(factory);
            const contextImport = actual[1];

            const namedImports = contextImport.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe("Context");
        });
    });

    describe("Serialization type import", () => {
        it("should create Serialization type import from @quatico/magellan-shared", () => {
            const actual = createClientImports(factory);
            const serializationImport = actual[2];

            expect(ts.isStringLiteral(serializationImport.moduleSpecifier)).toBe(true);
            expect((serializationImport.moduleSpecifier as ts.StringLiteral).text).toBe("@quatico/magellan-shared");

            const namedImports = serializationImport.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe(SERIALIZATION_TYPE_NAME);
            expect(importSpecifier.isTypeOnly).toBe(true);
        });

        it("should use the correct constant for Serialization name", () => {
            const actual = createClientImports(factory);
            const serializationImport = actual[2];

            const namedImports = serializationImport.importClause!.namedBindings as ts.NamedImports;
            const importSpecifier = namedImports.elements[0];
            expect(importSpecifier.name.text).toBe("Serialization");
        });
    });

    describe("import order and structure", () => {
        it("should create imports in the correct order", () => {
            const actual = createClientImports(factory);

            // First: remoteInvoke from @quatico/magellan-client
            const remoteInvokeImport = actual[0];
            const remoteInvokeModulePath = (remoteInvokeImport.moduleSpecifier as ts.StringLiteral).text;
            const remoteInvokeNamedImports = remoteInvokeImport.importClause!.namedBindings as ts.NamedImports;
            const remoteInvokeName = remoteInvokeNamedImports.elements[0].name.text;
            const remoteInvokeTypeOnly = remoteInvokeNamedImports.elements[0].isTypeOnly;

            expect(remoteInvokeModulePath).toBe("@quatico/magellan-client");
            expect(remoteInvokeName).toBe("remoteInvoke");
            expect(remoteInvokeTypeOnly).toBe(false);

            // Second: Context from @quatico/magellan-shared (type-only)
            const contextImport = actual[1];
            const contextModulePath = (contextImport.moduleSpecifier as ts.StringLiteral).text;
            const contextNamedImports = contextImport.importClause!.namedBindings as ts.NamedImports;
            const contextName = contextNamedImports.elements[0].name.text;
            const contextTypeOnly = contextNamedImports.elements[0].isTypeOnly;

            expect(contextModulePath).toBe("@quatico/magellan-shared");
            expect(contextName).toBe("Context");
            expect(contextTypeOnly).toBe(true);

            // Third: Serialization from @quatico/magellan-shared (type-only)
            const serializationImport = actual[2];
            const serializationModulePath = (serializationImport.moduleSpecifier as ts.StringLiteral).text;
            const serializationNamedImports = serializationImport.importClause!.namedBindings as ts.NamedImports;
            const serializationName = serializationNamedImports.elements[0].name.text;
            const serializationTypeOnly = serializationNamedImports.elements[0].isTypeOnly;

            expect(serializationModulePath).toBe("@quatico/magellan-shared");
            expect(serializationName).toBe("Serialization");
            expect(serializationTypeOnly).toBe(true);
        });

        it("should have exactly one runtime import and two type imports", () => {
            const actual = createClientImports(factory);

            const runtimeImports = actual.filter(importDecl => {
                const namedImports = importDecl.importClause!.namedBindings as ts.NamedImports;
                return !namedImports.elements[0].isTypeOnly;
            });

            const typeImports = actual.filter(importDecl => {
                const namedImports = importDecl.importClause!.namedBindings as ts.NamedImports;
                return namedImports.elements[0].isTypeOnly;
            });

            expect(runtimeImports).toHaveLength(1);
            expect(typeImports).toHaveLength(2);
        });
    });

    describe("generated AST structure", () => {
        it("should generate valid TypeScript AST nodes", () => {
            const actual = createClientImports(factory);

            actual.forEach(importDecl => {
                expect(importDecl.kind).toBe(ts.SyntaxKind.ImportDeclaration);
                expect(importDecl.importClause!.kind).toBe(ts.SyntaxKind.ImportClause);
                expect(importDecl.importClause!.namedBindings!.kind).toBe(ts.SyntaxKind.NamedImports);
                expect(importDecl.moduleSpecifier.kind).toBe(ts.SyntaxKind.StringLiteral);
            });
        });

        it("should create import clauses that are not type-only at the clause level", () => {
            const actual = createClientImports(factory);

            actual.forEach(importDecl => {
                expect(importDecl.importClause!.isTypeOnly).toBe(false);
            });
        });

        it("should create import specifiers without property names (no aliasing)", () => {
            const actual = createClientImports(factory);

            actual.forEach(importDecl => {
                const namedImports = importDecl.importClause!.namedBindings as ts.NamedImports;
                const importSpecifier = namedImports.elements[0];
                expect(importSpecifier.propertyName).toBeUndefined();
            });
        });
    });

    describe("consistency with constants", () => {
        it("should use imported constants for all names", () => {
            const actual = createClientImports(factory);

            // Check that the function uses the actual constant values
            const remoteInvokeImport = actual[0];
            const contextImport = actual[1];
            const serializationImport = actual[2];

            const remoteInvokeNamedImports = remoteInvokeImport.importClause!.namedBindings as ts.NamedImports;
            const contextNamedImports = contextImport.importClause!.namedBindings as ts.NamedImports;
            const serializationNamedImports = serializationImport.importClause!.namedBindings as ts.NamedImports;

            expect(remoteInvokeNamedImports.elements[0].name.text).toBe(REMOTE_INVOKE_PARAM_NAME);
            expect(contextNamedImports.elements[0].name.text).toBe(CONTEXT_TYPE_NAME);
            expect(serializationNamedImports.elements[0].name.text).toBe(SERIALIZATION_TYPE_NAME);
        });

        it("should match expected constant values", () => {
            // Verify our understanding of the constants is correct
            expect(REMOTE_INVOKE_PARAM_NAME).toBe("remoteInvoke");
            expect(CONTEXT_TYPE_NAME).toBe("Context");
            expect(SERIALIZATION_TYPE_NAME).toBe("Serialization");
        });
    });

    describe("function behavior", () => {
        it("should return a new array each time it's called", () => {
            const actual1 = createClientImports(factory);
            const actual2 = createClientImports(factory);

            expect(actual1).not.toBe(actual2);
            expect(actual1).toEqual(actual2);
        });

        it("should work with different factory instances", () => {
            const factory1 = ts.factory;
            const factory2 = ts.factory;

            const actual1 = createClientImports(factory1);
            const actual2 = createClientImports(factory2);

            expect(actual1).toHaveLength(3);
            expect(actual2).toHaveLength(3);

            // Should have same structure even with different factories
            actual1.forEach((importDecl, index) => {
                const otherImportDecl = actual2[index];
                const modulePath1 = (importDecl.moduleSpecifier as ts.StringLiteral).text;
                const modulePath2 = (otherImportDecl.moduleSpecifier as ts.StringLiteral).text;
                expect(modulePath1).toBe(modulePath2);
            });
        });
    });
});
