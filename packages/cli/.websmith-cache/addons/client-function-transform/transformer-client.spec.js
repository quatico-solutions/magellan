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
const websmith_core_1 = require("@quatico/websmith-core");
const typescript_1 = __importDefault(require("typescript"));
const transformer_client_1 = require("./transformer-client");
// helper to create source files with standard params
const printer = typescript_1.default.createPrinter();
const createSource = (fileContent) => typescript_1.default.createSourceFile("test.ts", fileContent, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
// @ts-expect-error -- projected method
const context = new websmith_core_1.Compiler({ reporter: new websmith_core_1.NoReporter() }).createProfileContextsIfNecessary().getContext();
const applyClientTransformer = (sourceFile) => printer.printFile(typescript_1.default.transform(sourceFile, [(0, transformer_client_1.createClientTransformer)(context)]).transformed[0]);
describe("createClientTransformer", () => {
    it("should set target in remoteInvoke w/ target set and correct signature", () => {
        const source = createSource(`// @service({"target":"expected"})
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date()`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service({"target":"expected"})
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should set namespace in remoteInvoke w/ namespace set and correct signature", () => {
        const source = createSource(`// @service({"namespace":"expected"})
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date()`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service({"namespace":"expected"})
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "expected" }, context, serialization);
            };
            "
        `);
    });
    it("should set namespace to default in remoteInvoke w/o namespace set and correct signature", () => {
        const source = createSource(`// @service()
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date()`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should not remove imports from allowed packages", () => {
        const source = createSource(`
            import { ClientContextHandler } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            
            // @service({"namespace":"expected"})
            export const getDate = async (_: never, context?: Context = ClientContextHandler.getClientContext("expected"), serialization?: Serialization) => new Date()
            `);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            import { ClientContextHandler } from "@quatico/magellan-client";
            // @service({"namespace":"expected"})
            export const getDate = async (_: never, context?: Context = ClientContextHandler.getClientContext("expected"), serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "expected" }, context, serialization);
            };
            "
        `);
    });
    it("should not remove default parameters", () => {
        const source = createSource(`
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            
            // @service({"namespace":"expected"})
            export const getDate = async (_: never, context?: Context = { client: { headers: { "x-test": "default" } } }, serialization?: Serialization) => new Date()
            `);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service({"namespace":"expected"})
            export const getDate = async (_: never, context?: Context = { client: { headers: { "x-test": "default" } } }, serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "expected" }, context, serialization);
            };
            "
        `);
    });
    it("should set add no data if no data is provided (never type)", () => {
        const source = createSource(`// @service()
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date()`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should set add no data if no data is provided (Record<string, never> type)", () => {
        const source = createSource(`// @service()
            export const getDate = async (_: Record<string, never>, context?: Context, serialization?: Serialization) => new Date()`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getDate = async (_: Record<string, never>, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should transform arrow with custom Context and Serialization parameter names", () => {
        const source = createSource(`// @service()
            export const getDate = async (_: never, ctx?: Context, ser?: Serialization) => new Date()`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getDate = async (_: never, ctx?: Context, ser?: Serialization) => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" }, ctx, ser);
            };
            "
        `);
    });
    it("should remove imports and non-exported functions from the service function file", () => {
        const source = createSource(`
            import fs from "fs";
            import { type Context } from "@quatico/magellan-shared"; // Allowed import
            import { type Serialization } from "@quatico/magellan-shared"; // Allowed import

            export type LoginParams = {
                username: string;
                password: string;
            };

            export type UserData = {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
                filePath?: string;
            };

            // This function should be completely removed by the transformer
            function readUserData(username: string, filePath = "./assets/resources/user-data.csv") { 
                return fs
                    .readFileSync(filePath, "utf-8")
                    .split("\n")
                    .filter(line => line.trim().includes(",")) // filter out empty lines
                    .find(line => line.includes(username))
                    ?.split(",");
            }

            // This function should be completely removed by the transformer
            export const logTestToTheConsole = () => { 
                console.log("test"); 
            }

            // @service()
            export const loginUser = async (params: LoginParams, context?: Context, serialization?: Serialization): Promise<UserData | void> => {
                // This is the original server body which is removed by the transformer
                const { username, password } = params;

                const entry = readUserData(username);
                if (entry?.includes(password)) {
                    const [id, userName, password, firstName, lastName, email, phone] = entry;
                    return { id, username: userName, firstName, lastName, email, phone };
                }

                return undefined;
            };
        `);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
"import { remoteInvoke } from "@quatico/magellan-client";
import { type Context } from "@quatico/magellan-shared";
import { type Serialization } from "@quatico/magellan-shared";
import fs from "fs";
export type LoginParams = {
    username: string;
    password: string;
};
export type UserData = {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    filePath?: string;
};
// @service()
export const loginUser = async (params: LoginParams, context?: Context, serialization?: Serialization): Promise<UserData | void> => {
    return remoteInvoke({ name: "loginUser", data: { params: params }, namespace: "default" }, context, serialization);
};
"
`);
    });
    it("should keep type/interface declarations but remove other code", () => {
        const source = createSource(`
            import fs from "fs"; 
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";

            const MY_CONST = 123; // Should be removed
            function helper() { console.log("helper"); } // Should be removed

            export interface MyInterface { id: string; }
            export type MyType = { value: number };
            export enum MyEnum { A, B }

            // @service()
            export const testFunc = (input: MyInterface, context?: Context, serialization?: Serialization): MyType => {
                return { value: input.id.length };
            }
        `);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            export interface MyInterface {
                id: string;
            }
            export type MyType = {
                value: number;
            };
            export enum MyEnum {
                A,
                B
            }
            // @service()
            export const testFunc = (input: MyInterface, context?: Context, serialization?: Serialization): MyType => {
                return remoteInvoke({ name: "testFunc", data: { input: input }, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should set parameter correctly as data property (primitive parameter)", () => {
        const source = createSource(`// @service()
            export const getInputAsOutput = (input: string, context?: Context, serialization?: Serialization) => input`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getInputAsOutput = (input: string, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { input: input }, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should set parameter correctly as data property (complex object)", () => {
        const source = createSource(`
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            export interface MyInput { name: string; age: number; others: { [key: string]: unknown; }; }
            // @service()
            export const getInputAsOutput = (obj: MyInput, context?: Context, serialization?: Serialization) => obj;
        `);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            export interface MyInput {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }
            // @service()
            export const getInputAsOutput = (obj: MyInput, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { obj: obj }, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    it("should set parameter correctly as data property (complex object with inline type)", () => {
        const source = createSource(`// @service()
            export const getInputAsOutput = (obj: { name: string; age: number; others: { [key: string]: unknown; }; }, context?: Context, serialization?: Serialization) => obj`);
        const actual = applyClientTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            import { type Context } from "@quatico/magellan-shared";
            import { type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getInputAsOutput = (obj: {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }, context?: Context, serialization?: Serialization) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { obj: obj }, namespace: "default" }, context, serialization);
            };
            "
        `);
    });
    // --- Error Handling Tests ---
    it("should throw error if function has no parameters", () => {
        const source = createSource(`// @service()
            export const getDate = async () => new Date()`);
        expect(() => applyClientTransformer(source)).toThrow(/must have exactly three parameters/);
    });
    it("should throw error if function has one parameter", () => {
        const source = createSource(`// @service()
            export const getDate = async (input: string) => input`);
        expect(() => applyClientTransformer(source)).toThrow(/must have exactly three parameters/);
    });
    it("should throw error if function has two parameters", () => {
        const source = createSource(`// @service()
            export const getDate = async (input: string, context?: Context) => input`);
        expect(() => applyClientTransformer(source)).toThrow(/must have exactly three parameters/);
    });
    it("should throw error if function has four parameters", () => {
        const source = createSource(`// @service()
            export const getDate = async (p1: string, p2: Context, p3: Serialization, p4: number) => p1`);
        expect(() => applyClientTransformer(source)).toThrow(/must have exactly three parameters/);
    });
    it("should throw error if second parameter is not Context", () => {
        const source = createSource(`// @service()
            export const getDate = async (input: string, wrongParam: number, ser?: Serialization) => input`);
        expect(() => applyClientTransformer(source)).toThrow(/second parameter.*must be 'context\?: Context'/);
    });
    it("should throw error if third parameter is not Serialization", () => {
        const source = createSource(`// @service()
            export const getDate = async (input: string, ctx?: Context, wrongParam: number) => input`);
        expect(() => applyClientTransformer(source)).toThrow(/third parameter.*must be 'serialization\?: Serialization'/);
    });
    it("should throw error on unsupported destructured object as input", () => {
        const source = createSource(`// @service()
            export const getInputAsOutput = ({ name, type }: { name: string; type: number }, ctx?: Context, ser?: Serialization) => ({ nameOut: name, typeOut: type })`);
        expect(() => applyClientTransformer(source)).toThrow(/input.*cannot be a destructured object/);
    });
    it("should throw on unsupported function as input", () => {
        const source = createSource(`// @service()
            export const provideFnAsInput = (fn: (input: string) => string, ctx?: Context, ser?: Serialization) => ({})`);
        expect(() => applyClientTransformer(source)).toThrow(/input.*cannot be a function type/);
    });
    it("should throw error when Context interface is defined", () => {
        const source = createSource(`
            import { type Serialization } from "@quatico/magellan-shared";
            interface Context { /* Custom definition */ }
            // @service()
            export const getUserRoles = async (_: never, ctx: Context, ser?: Serialization): Promise<string[]> => { return []; }
        `);
        expect(() => applyClientTransformer(source)).toThrow(/Custom declaration of type 'Context' is not allowed/);
    });
    it("should throw error when Context type is defined", () => {
        const source = createSource(`
            import { type Serialization } from "@quatico/magellan-shared";
            type Context = { /* Custom definition */ };
            // @service()
            export const getUserData = async (_: never, ctx: Context, ser?: Serialization) => { return null; }
        `);
        expect(() => applyClientTransformer(source)).toThrow(/Custom declaration of type 'Context' is not allowed/);
    });
    it("should throw error when Serialization interface is defined", () => {
        const source = createSource(`
            import { type Context } from "@quatico/magellan-shared";
            interface Serialization { /* Custom definition */ }
            // @service()
            export const getUserRoles = async (_: never, ctx: Context, ser?: Serialization): Promise<string[]> => { return []; }
        `);
        expect(() => applyClientTransformer(source)).toThrow(/Custom declaration of type 'Serialization' is not allowed/);
    });
    it("should throw error when Serialization type is defined", () => {
        const source = createSource(`
            import { type Context } from "@quatico/magellan-shared";
            type Serialization = { /* Custom definition */ };
            // @service()
            export const getUserData = async (_: never, ctx: Context, ser?: Serialization) => { return null; }
        `);
        expect(() => applyClientTransformer(source)).toThrow(/Custom declaration of type 'Serialization' is not allowed/);
    });
    // --- Barrel File Tests ---
    describe("barrel file handling", () => {
        const createMockedContext = (files) => {
            const baseContext = context;
            const mockedSystem = {
                ...baseContext.getSystem(),
                fileExists: (path) => {
                    // Normalize path for matching
                    const normalizedPath = path.replace(/\\/g, "/");
                    return Object.keys(files).some(key => normalizedPath.endsWith(key) || normalizedPath === key);
                },
                readFile: (path) => {
                    const normalizedPath = path.replace(/\\/g, "/");
                    const matchingKey = Object.keys(files).find(key => normalizedPath.endsWith(key) || normalizedPath === key);
                    return matchingKey ? files[matchingKey] : undefined;
                },
            };
            return {
                ...baseContext,
                getSystem: () => mockedSystem,
            };
        };
        const createSourceWithPath = (filePath, fileContent) => typescript_1.default.createSourceFile(filePath, fileContent, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
        const applyClientTransformerWithContext = (sourceFile, ctx) => printer.printFile(typescript_1.default.transform(sourceFile, [(0, transformer_client_1.createClientTransformer)(ctx)]).transformed[0]);
        it("should process barrel file with 'export * from' pointing to service file", () => {
            const serviceFileContent = `
                import { type Context } from "@quatico/magellan-shared";
                import { type Serialization } from "@quatico/magellan-shared";
                // @service()
                export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date();
            `;
            const barrelFileContent = `export * from "./service-file";`;
            const mockedContext = createMockedContext({
                "service-file.ts": serviceFileContent,
            });
            const barrelSource = createSourceWithPath("/project/src/index.ts", barrelFileContent);
            const result = applyClientTransformerWithContext(barrelSource, mockedContext);
            // The barrel file should be processed (returned as a new source file)
            // and contain the same export statement
            expect(result).toContain('export * from "./service-file"');
        });
        it("should process barrel file with named exports from service file", () => {
            const serviceFileContent = `
                import { type Context } from "@quatico/magellan-shared";
                import { type Serialization } from "@quatico/magellan-shared";
                // @service()
                export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date();
            `;
            const barrelFileContent = `export { getDate } from "./service-file";`;
            const mockedContext = createMockedContext({
                "service-file.ts": serviceFileContent,
            });
            const barrelSource = createSourceWithPath("/project/src/index.ts", barrelFileContent);
            const result = applyClientTransformerWithContext(barrelSource, mockedContext);
            expect(result).toContain('export { getDate } from "./service-file"');
        });
        it("should not process barrel file with only non-service re-exports", () => {
            const nonServiceFileContent = `
                export const helper = () => "hello";
                export const util = (x: number) => x * 2;
            `;
            const barrelFileContent = `export * from "./utils";`;
            const mockedContext = createMockedContext({
                "utils.ts": nonServiceFileContent,
            });
            const barrelSource = createSourceWithPath("/project/src/index.ts", barrelFileContent);
            const originalSource = barrelSource;
            const transformedSource = typescript_1.default.transform(originalSource, [(0, transformer_client_1.createClientTransformer)(mockedContext)]).transformed[0];
            // Should return the same source file (not processed)
            expect(transformedSource).toBe(originalSource);
        });
        it("should process barrel file with mixed service and non-service re-exports", () => {
            const serviceFileContent = `
                import { type Context } from "@quatico/magellan-shared";
                import { type Serialization } from "@quatico/magellan-shared";
                // @service()
                export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date();
            `;
            const utilsFileContent = `
                export const helper = () => "hello";
            `;
            const barrelFileContent = `
                export * from "./service-file";
                export * from "./utils";
            `;
            const mockedContext = createMockedContext({
                "service-file.ts": serviceFileContent,
                "utils.ts": utilsFileContent,
            });
            const barrelSource = createSourceWithPath("/project/src/index.ts", barrelFileContent);
            const result = applyClientTransformerWithContext(barrelSource, mockedContext);
            // Should be processed because at least one re-export points to a service file
            expect(result).toContain('export * from "./service-file"');
            expect(result).toContain('export * from "./utils"');
        });
        it("should handle re-exports from non-existent files gracefully", () => {
            const barrelFileContent = `export * from "./non-existent";`;
            const mockedContext = createMockedContext({});
            const barrelSource = createSourceWithPath("/project/src/index.ts", barrelFileContent);
            const originalSource = barrelSource;
            const transformedSource = typescript_1.default.transform(originalSource, [(0, transformer_client_1.createClientTransformer)(mockedContext)]).transformed[0];
            // Should return the same source file (not processed)
            expect(transformedSource).toBe(originalSource);
        });
        it("should process barrel file with subdirectory service re-export", () => {
            const serviceFileContent = `
                import { type Context } from "@quatico/magellan-shared";
                import { type Serialization } from "@quatico/magellan-shared";
                // @service()
                export const fetchData = async (params: { id: string }, context?: Context, serialization?: Serialization) => ({ id: params.id });
            `;
            const barrelFileContent = `export * from "./services/data-service";`;
            const mockedContext = createMockedContext({
                "services/data-service.ts": serviceFileContent,
            });
            const barrelSource = createSourceWithPath("/project/src/index.ts", barrelFileContent);
            const result = applyClientTransformerWithContext(barrelSource, mockedContext);
            expect(result).toContain('export * from "./services/data-service"');
        });
    });
});
