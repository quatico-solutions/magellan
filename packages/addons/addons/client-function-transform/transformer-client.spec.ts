/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import * as ts from "typescript";
import { createClientTransformer } from "./transformer-client";

describe("createClientTransformer", () => {
    it("should set target in remoteInvoke w/ target set", () => {
        const printer = ts.createPrinter();
        const source = `// @service({"target":"expected"})
        export const getDate = async () => new Date();`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service({"target":"expected"})
            export const getDate = async () => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" });
            };
            "
        `);
    });

    it("should set target to default in remoteInvoke w/o target set", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getDate = async () => new Date();`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getDate = async () => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" });
            };
            "
        `);
    });

    it("should only remove imports in the service function file", () => {
        const printer = ts.createPrinter();

        const serviceFunctionFile = ts.createSourceFile(
            "function/service-function.ts",
            `import fs from "fs";

            // @service()
            export const readTextFromFile = (): string => {
                return fs.readFileSync("test.txt", "utf8");
            }`,
            ts.ScriptTarget.Latest
        );
        const indexFile = ts.createSourceFile(
            "function/index.ts",
            `import { readTextFromFile } from "./service-function";

            const getTextFromFileOnServer = (): string => {
                return readTextFromFile();
            }`,
            ts.ScriptTarget.Latest
        );

        const transformed = ts.transform([indexFile, serviceFunctionFile], [createClientTransformer({ libPath: "@quatico/magellan-client" })]);
        const actual = printer.printFile(transformed.transformed[0]);
        expect(actual).toMatchInlineSnapshot(`
            "import { readTextFromFile } from "./service-function";
            const getTextFromFileOnServer = (): string => {
                return readTextFromFile();
            };
            "
        `);

        const transformedServiceFunctionFile = ts.transform(serviceFunctionFile, [createClientTransformer({ libPath: "@quatico/magellan-client" })]);
        const actualServiceFunctionFile = printer.printFile(transformedServiceFunctionFile.transformed[0]);
        expect(actualServiceFunctionFile).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const readTextFromFile = (): string => {
                return remoteInvoke({ name: "readTextFromFile", data: {}, namespace: "default" });
            };
            "
        `);
    });

    it("should remove not exported functions from the service function file", () => {
        const printer = ts.createPrinter();
        const content = `
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

/**
 * Reads user data from a CSV file
 *
 * @param username - The username to search for
 * @param filePath - The path to the CSV file
 * @returns The user data as an array of strings, or undefined if the user is not found
 */
function readUserData(username: string, filePath = "./assets/resources/user-data.csv") {
    return fs
        .readFileSync(filePath, "utf-8")
        .split("\n")
        .filter(line => line.trim().includes(",")) // filter out empty lines
        .find(line => line.includes(username))
        ?.split(",");
}

export const logTestToTheConsole = () => {
    console.log("test");
}

// @service()
export const loginUser = async (params: LoginParams): Promise<UserData | void> => {
    const { username, password } = params;

    const entry = readUserData(username);
    if (entry?.includes(password)) {
        // @ts-expect-error - we cannot leave out the password field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [id, userName, password, firstName, lastName, email, phone] = entry;
        return { id, username: userName, firstName, lastName, email, phone };
    }

    return undefined;
};
        `;
        const userServiceFile = ts.createSourceFile("function/user-service.ts", content, ts.ScriptTarget.Latest);

        const transformed = ts.transform([userServiceFile], [createClientTransformer({ libPath: "@quatico/magellan-client" })]);
        const actual = printer.printFile(transformed.transformed[0]);
        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
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
            export const loginUser = async (params: LoginParams): Promise<UserData | void> => {
                return remoteInvoke({ name: "loginUser", data: { params }, namespace: "default" });
            };
            "
        `);
    });

    it("should remove all ES module imports", () => {
        const printer = ts.createPrinter();
        const source = `
        import fs from "fs";

        // @service()
        export const getTextFromFileOnServer = (): string => {
            return fs.readFileSync("test.txt", "utf8");
        }`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getTextFromFileOnServer = (): string => {
                return remoteInvoke({ name: "getTextFromFileOnServer", data: {}, namespace: "default" });
            };
            "
        `);
    });

    it("should remove all CommonJS require statements", () => {
        const printer = ts.createPrinter();
        const source = `
        const fs = require("fs");

        // @service()
        export const getTextFromFileOnServer = (): string => {
            return fs.readFileSync("test.txt", "utf8");
        }`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getTextFromFileOnServer = (): string => {
                return remoteInvoke({ name: "getTextFromFileOnServer", data: {}, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameter correctly as data property (single primitive parameter)", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getInputAsOutput = (input: string) => input;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getInputAsOutput = (input: string) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { input }, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameters correctly as data properties (multiple primitive parameters)", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getInputAsOutput = (name: string, type: number) => ({ nameOut: name, typeOut: type });`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getInputAsOutput = (name: string, type: number) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { name, type }, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameter correctly as data property (complex object)", () => {
        const printer = ts.createPrinter();
        const source = `export interface MyInput { name: string; age: number; others: { [key: string]: unknown; }; }
        // @service()
        export const getInputAsOutput = (obj: MyInput) => obj;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            export interface MyInput {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }
            // @service()
            export const getInputAsOutput = (obj: MyInput) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { obj }, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameter correctly as data property (complex object with inline type)", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getInputAsOutput = (obj: { name: string; age: number; others: { [key: string]: unknown; }; }) => obj;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getInputAsOutput = (obj: {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { obj }, namespace: "default" });
            };
            "
        `);
    });

    it("should throw on unsupported destructured object as input", () => {
        const source = `// @service()
        export const getInputAsOutput = ({ name, type }: { name: string; type: number }) => ({ nameOut: name, typeOut: type });`;

        expect(() =>
            ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
                createClientTransformer({ libPath: "@quatico/magellan-client" }),
            ])
        ).toThrowErrorMatchingInlineSnapshot(`
            "
                            Only primitive or object parameters are supported as function inputs. No destructed objects. 
                            We currently support single and multiple parameters (e.g., 
                                1. export const fn = (a: string) => a
                                2. export const fn = (name: string, age: number) => "Hi " + name + ". Your age is: " + age
                                 
                            But not something like: export const fn = ({ name, type }: { name: string; type: number }) => ({ nameOut: name, typeOut: type })
                            Please use the following instead: 
                                1. export interface Wrapper { name: string; type: number; };
                                2. export const fn = (wrapper: Wrapper) => ({ nameOut: wrapper.name, typeOut: wrapper.type })
                        "
        `);
    });

    it("should throw on unsupported function as input", () => {
        const source = `// @service()
        export const provideFnAsInput = (fn: (input: string) => string) => ({});`;

        expect(() =>
            ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
                createClientTransformer({ libPath: "@quatico/magellan-client" }),
            ])
        ).toThrowErrorMatchingInlineSnapshot(`
            "
                            Only primitive or object parameters are supported as function inputs. No function/arrow function's are acceptable inputs. 
                            We currently support single and multiple parameters (e.g., 
                                1. export const fn = (a: string) => a
                                2. export const fn = (name: string, age: number) => "Hi " + name + ". Your age is: " + age
                                3. export interface Wrapper { name: string; type: number; }; 
                                   export const fn = (wrapper: Wrapper) => ({ nameOut: wrapper.name, typeOut: wrapper.type })
                        "
        `);
    });
});
