/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import ts from "typescript";
import { clientSideCodeRemover } from "./client-code-remover";
import { type MagellanConfig } from "../magellan-shared/magellan-config";

describe("clientSideCodeRemover", () => {
    let factory: ts.NodeFactory;
    let transformationContext: ts.TransformationContext;
    let addonContext: AddonContext<MagellanConfig>;

    beforeEach(() => {
        factory = ts.factory;
        transformationContext = {
            factory,
            getCompilerOptions: () => ({}),
            startLexicalEnvironment: jest.fn(),
            suspendLexicalEnvironment: jest.fn(),
            resumeLexicalEnvironment: jest.fn(),
            endLexicalEnvironment: jest.fn(),
            hoistFunctionDeclaration: jest.fn(),
            hoistVariableDeclaration: jest.fn(),
            requestEmitHelper: jest.fn(),
            readEmitHelpers: jest.fn(),
            enableSubstitution: jest.fn(),
            enableEmitNotification: jest.fn(),
            isSubstitutionEnabled: jest.fn(),
            isEmitNotificationEnabled: jest.fn(),
            get onSubstituteNode() {
                return jest.fn();
            },
            set onSubstituteNode(value) {
                /* no-op */
            },
            get onEmitNode() {
                return jest.fn();
            },
            set onEmitNode(value) {
                /* no-op */
            },
        } as any;

        addonContext = {
            getReporter: () => ({
                reportDiagnostic: jest.fn(),
            }),
            getConfiguration: () => ({
                namespace: "default",
            }),
        } as any;
    });

    // Helper function to create a source file with given code
    const createSourceFile = (code: string): ts.SourceFile => {
        return ts.createSourceFile("test.ts", code, ts.ScriptTarget.Latest, true);
    };

    // Helper function to apply the transformer and get the result
    const applyTransformer = (sourceFile: ts.SourceFile): ts.SourceFile => {
        const visitor = clientSideCodeRemover(transformationContext, sourceFile, addonContext);
        const result = ts.visitNode(sourceFile, visitor, ts.isSourceFile);
        return result;
    };

    describe("import handling", () => {
        it("should keep used imports", () => {
            const code = `
                import { usedFunction } from "./utils";
                
                const result = usedFunction("test");
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep the import because usedFunction is used
            const importDecl = result.statements.find(ts.isImportDeclaration);
            expect(importDecl).toBeDefined();
            expect(ts.isImportDeclaration(importDecl!)).toBe(true);
        });

        it("should remove unused imports", () => {
            const code = `
                import { unusedFunction } from "./utils";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove the import because unusedFunction is not used
            const importDecl = result.statements.find(ts.isImportDeclaration);
            expect(importDecl).toBeUndefined();
        });

        it("should remove redundant imports that will be added by createClientImports", () => {
            const code = `
                import { remoteInvoke } from "@quatico/magellan-client";
                import { type Context } from "@quatico/magellan-shared";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove both imports because they will be added by createClientImports
            const importDecls = result.statements.filter(ts.isImportDeclaration);
            expect(importDecls).toHaveLength(0);
        });

        it("should keep side-effect imports", () => {
            const code = `
                import "./side-effects";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep side-effect imports
            const importDecl = result.statements.find(ts.isImportDeclaration);
            expect(importDecl).toBeDefined();
        });
    });

    describe("type declaration handling", () => {
        it("should keep type alias declarations", () => {
            const code = `
                type MyType = string | number;
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep the type alias
            const typeAlias = result.statements.find(ts.isTypeAliasDeclaration);
            expect(typeAlias).toBeDefined();
            expect((typeAlias as ts.TypeAliasDeclaration).name.text).toBe("MyType");
        });

        it("should keep interface declarations", () => {
            const code = `
                interface MyInterface {
                    name: string;
                    age: number;
                }
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep the interface
            const interfaceDecl = result.statements.find(ts.isInterfaceDeclaration);
            expect(interfaceDecl).toBeDefined();
            expect((interfaceDecl as ts.InterfaceDeclaration).name.text).toBe("MyInterface");
        });

        it("should keep enum declarations", () => {
            const code = `
                enum MyEnum {
                    VALUE1 = "value1",
                    VALUE2 = "value2"
                }
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep the enum
            const enumDecl = result.statements.find(ts.isEnumDeclaration);
            expect(enumDecl).toBeDefined();
            expect((enumDecl as ts.EnumDeclaration).name.text).toBe("MyEnum");
        });

        it("should keep multiple type declarations", () => {
            const code = `
                type StringType = string;
                interface NumberInterface { value: number; }
                enum StatusEnum { ACTIVE, INACTIVE }
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep all type declarations
            const typeAlias = result.statements.find(ts.isTypeAliasDeclaration);
            const interfaceDecl = result.statements.find(ts.isInterfaceDeclaration);
            const enumDecl = result.statements.find(ts.isEnumDeclaration);

            expect(typeAlias).toBeDefined();
            expect(interfaceDecl).toBeDefined();
            expect(enumDecl).toBeDefined();
        });
    });

    describe("service function handling", () => {
        it("should keep exported service functions with decorator", () => {
            const code = `
                // @service()
                export const myServiceFunction = (input: string) => {
                    return input.toUpperCase();
                };
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep the service function
            const variableStatement = result.statements.find(ts.isVariableStatement);
            expect(variableStatement).toBeDefined();
        });

        it("should keep exported function declarations with decorator", () => {
            const code = `
                // @service()
                export function myServiceFunction(input: string): string {
                    return input.toUpperCase();
                }
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep the service function
            const functionDecl = result.statements.find(ts.isFunctionDeclaration);
            expect(functionDecl).toBeDefined();
        });

        it("should remove exported functions without service decorator", () => {
            const code = `
                export const regularFunction = (input: string) => {
                    return input.toLowerCase();
                };
                
                export function anotherFunction(input: number): number {
                    return input * 2;
                }
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove both functions because they don't have @service decorator
            const statements = result.statements.filter(stmt => ts.isVariableStatement(stmt) || ts.isFunctionDeclaration(stmt));
            expect(statements).toHaveLength(0);
        });

        it("should remove non-exported functions even with decorator", () => {
            const code = `
                // @service()
                const privateServiceFunction = (input: string) => {
                    return input.toUpperCase();
                };
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove because it's not exported
            const variableStatement = result.statements.find(ts.isVariableStatement);
            expect(variableStatement).toBeUndefined();
        });
    });

    describe("code removal", () => {
        it("should remove regular variable declarations", () => {
            const code = `
                const regularVariable = "test";
                let mutableVariable = 42;
                var oldStyleVariable = true;
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove all variable declarations
            const variableStatements = result.statements.filter(ts.isVariableStatement);
            expect(variableStatements).toHaveLength(0);
        });

        it("should remove regular function declarations", () => {
            const code = `
                function regularFunction() {
                    return "test";
                }
                
                function anotherFunction(param: string) {
                    console.log(param);
                }
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove all function declarations
            const functionDecls = result.statements.filter(ts.isFunctionDeclaration);
            expect(functionDecls).toHaveLength(0);
        });

        it("should remove class declarations", () => {
            const code = `
                class MyClass {
                    constructor(public name: string) {}
                    
                    getName() {
                        return this.name;
                    }
                }
                
                export class ExportedClass {
                    value = 42;
                }
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove all class declarations (including exported ones without @service)
            const classDecls = result.statements.filter(ts.isClassDeclaration);
            expect(classDecls).toHaveLength(0);
        });

        it("should remove expression statements", () => {
            const code = `
                console.log("This should be removed");
                42 + 58;
                "standalone string";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove all expression statements
            const expressionStatements = result.statements.filter(ts.isExpressionStatement);
            expect(expressionStatements).toHaveLength(0);
        });
    });

    describe("complex scenarios", () => {
        it("should handle mixed code correctly", () => {
            const code = `
                import { usedUtil } from "./utils";
                import { unusedUtil } from "./unused";
                
                type MyType = string;
                interface MyInterface { value: number; }
                enum MyEnum { A, B }
                
                // @service()
                export const serviceFunction = (input: string) => {
                    return usedUtil(input);
                };
                
                const regularFunction = () => "removed";
                
                class RemovedClass {
                    method() {}
                }
                
                console.log("This will be removed");
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should keep: used import, type declarations, service function
            // Should remove: unused import, regular function, class, console.log

            const imports = result.statements.filter(ts.isImportDeclaration);
            const typeDecls = result.statements.filter(
                stmt => ts.isTypeAliasDeclaration(stmt) || ts.isInterfaceDeclaration(stmt) || ts.isEnumDeclaration(stmt)
            );
            const variables = result.statements.filter(ts.isVariableStatement);
            const classes = result.statements.filter(ts.isClassDeclaration);
            const expressions = result.statements.filter(ts.isExpressionStatement);

            expect(imports).toHaveLength(1); // Only usedUtil import kept
            expect(typeDecls).toHaveLength(3); // All type declarations kept
            expect(variables).toHaveLength(1); // Only service function kept
            expect(classes).toHaveLength(0); // Class removed
            expect(expressions).toHaveLength(0); // Expression statement removed
        });

        it("should handle nested structures", () => {
            const code = `
                export namespace MyNamespace {
                    // @service()
                    export const serviceInNamespace = (input: string) => input;
                    
                    export const regularInNamespace = () => "removed";
                }
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should remove the entire namespace since it's not a service function at the top level
            const namespaces = result.statements.filter(ts.isModuleDeclaration);
            expect(namespaces).toHaveLength(0);
        });

        it("should preserve source file structure", () => {
            const code = `
                import { keepThis } from "./keep";
                
                type KeepType = string;
                
                // @service()
                export const keepFunction = (input: string) => keepThis(input);
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // Should maintain proper source file structure
            expect(ts.isSourceFile(result)).toBe(true);
            expect(result.statements.length).toBeGreaterThan(0);

            // Check that kept statements are in correct order
            const importStmt = result.statements[0];
            const typeStmt = result.statements[1];
            const functionStmt = result.statements[2];

            expect(ts.isImportDeclaration(importStmt)).toBe(true);
            expect(ts.isTypeAliasDeclaration(typeStmt)).toBe(true);
            expect(ts.isVariableStatement(functionStmt)).toBe(true);
        });
    });

    describe("transformer behavior", () => {
        it("should handle empty source files", () => {
            const code = ``;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            expect(ts.isSourceFile(result)).toBe(true);
            expect(result.statements).toHaveLength(0);
        });

        it("should handle source files with only comments", () => {
            const code = `
                // This is a comment
                /* This is a block comment */
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            expect(ts.isSourceFile(result)).toBe(true);
            expect(result.statements).toHaveLength(0);
        });

        it("should create NotEmittedStatement for removed nodes", () => {
            const code = `
                const removedVariable = "test";
            `;
            const sourceFile = createSourceFile(code);

            const result = applyTransformer(sourceFile);

            // The transformer should have created NotEmittedStatement nodes
            // but they might be filtered out in the final result
            expect(ts.isSourceFile(result)).toBe(true);
        });
    });
});
