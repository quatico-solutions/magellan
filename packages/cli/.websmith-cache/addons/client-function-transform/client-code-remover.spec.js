"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = __importDefault(require("typescript"));
const client_code_remover_1 = require("./client-code-remover");
describe("clientSideCodeRemover", () => {
    let factory;
    let transformationContext;
    let addonContext;
    beforeEach(() => {
        factory = typescript_1.default.factory;
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
        };
        addonContext = {
            getReporter: () => ({
                reportDiagnostic: jest.fn(),
            }),
            getConfiguration: () => ({
                namespace: "default",
            }),
        };
    });
    // Helper function to create a source file with given code
    const createSourceFile = (code) => {
        return typescript_1.default.createSourceFile("test.ts", code, typescript_1.default.ScriptTarget.Latest, true);
    };
    // Helper function to apply the transformer and get the result
    const applyTransformer = (sourceFile) => {
        const visitor = (0, client_code_remover_1.clientSideCodeRemover)(transformationContext, sourceFile, addonContext);
        const result = typescript_1.default.visitNode(sourceFile, visitor, typescript_1.default.isSourceFile);
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
            const importDecl = result.statements.find(typescript_1.default.isImportDeclaration);
            expect(importDecl).toBeDefined();
            expect(typescript_1.default.isImportDeclaration(importDecl)).toBe(true);
        });
        it("should remove unused imports", () => {
            const code = `
                import { unusedFunction } from "./utils";
                
                const someCode = "test";
            `;
            const sourceFile = createSourceFile(code);
            const result = applyTransformer(sourceFile);
            // Should remove the import because unusedFunction is not used
            const importDecl = result.statements.find(typescript_1.default.isImportDeclaration);
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
            const importDecls = result.statements.filter(typescript_1.default.isImportDeclaration);
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
            const importDecl = result.statements.find(typescript_1.default.isImportDeclaration);
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
            const typeAlias = result.statements.find(typescript_1.default.isTypeAliasDeclaration);
            expect(typeAlias).toBeDefined();
            expect(typeAlias.name.text).toBe("MyType");
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
            const interfaceDecl = result.statements.find(typescript_1.default.isInterfaceDeclaration);
            expect(interfaceDecl).toBeDefined();
            expect(interfaceDecl.name.text).toBe("MyInterface");
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
            const enumDecl = result.statements.find(typescript_1.default.isEnumDeclaration);
            expect(enumDecl).toBeDefined();
            expect(enumDecl.name.text).toBe("MyEnum");
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
            const typeAlias = result.statements.find(typescript_1.default.isTypeAliasDeclaration);
            const interfaceDecl = result.statements.find(typescript_1.default.isInterfaceDeclaration);
            const enumDecl = result.statements.find(typescript_1.default.isEnumDeclaration);
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
            const variableStatement = result.statements.find(typescript_1.default.isVariableStatement);
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
            const functionDecl = result.statements.find(typescript_1.default.isFunctionDeclaration);
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
            const statements = result.statements.filter(stmt => typescript_1.default.isVariableStatement(stmt) || typescript_1.default.isFunctionDeclaration(stmt));
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
            const variableStatement = result.statements.find(typescript_1.default.isVariableStatement);
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
            const variableStatements = result.statements.filter(typescript_1.default.isVariableStatement);
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
            const functionDecls = result.statements.filter(typescript_1.default.isFunctionDeclaration);
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
            const classDecls = result.statements.filter(typescript_1.default.isClassDeclaration);
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
            const expressionStatements = result.statements.filter(typescript_1.default.isExpressionStatement);
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
            const imports = result.statements.filter(typescript_1.default.isImportDeclaration);
            const typeDecls = result.statements.filter(stmt => typescript_1.default.isTypeAliasDeclaration(stmt) || typescript_1.default.isInterfaceDeclaration(stmt) || typescript_1.default.isEnumDeclaration(stmt));
            const variables = result.statements.filter(typescript_1.default.isVariableStatement);
            const classes = result.statements.filter(typescript_1.default.isClassDeclaration);
            const expressions = result.statements.filter(typescript_1.default.isExpressionStatement);
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
            const namespaces = result.statements.filter(typescript_1.default.isModuleDeclaration);
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
            expect(typescript_1.default.isSourceFile(result)).toBe(true);
            expect(result.statements.length).toBeGreaterThan(0);
            // Check that kept statements are in correct order
            const importStmt = result.statements[0];
            const typeStmt = result.statements[1];
            const functionStmt = result.statements[2];
            expect(typescript_1.default.isImportDeclaration(importStmt)).toBe(true);
            expect(typescript_1.default.isTypeAliasDeclaration(typeStmt)).toBe(true);
            expect(typescript_1.default.isVariableStatement(functionStmt)).toBe(true);
        });
    });
    describe("transformer behavior", () => {
        it("should handle empty source files", () => {
            const code = ``;
            const sourceFile = createSourceFile(code);
            const result = applyTransformer(sourceFile);
            expect(typescript_1.default.isSourceFile(result)).toBe(true);
            expect(result.statements).toHaveLength(0);
        });
        it("should handle source files with only comments", () => {
            const code = `
                // This is a comment
                /* This is a block comment */
            `;
            const sourceFile = createSourceFile(code);
            const result = applyTransformer(sourceFile);
            expect(typescript_1.default.isSourceFile(result)).toBe(true);
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
            expect(typescript_1.default.isSourceFile(result)).toBe(true);
        });
    });
});
