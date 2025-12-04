/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import ts from "typescript";
import { isParameter } from "./is-parameter";

describe("isParameter", () => {
    // Helper function to create a parameter declaration from source code
    const createParameterFromSource = (parameterCode: string): ts.ParameterDeclaration => {
        const sourceCode = `function test(${parameterCode}) {}`;
        const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.Latest, true);

        const functionDeclaration = sourceFile.statements[0] as ts.FunctionDeclaration;
        return functionDeclaration.parameters[0];
    };

    describe("matching parameters", () => {
        it("should return true for exact type match", () => {
            const param = createParameterFromSource("data: UserData");

            expect(isParameter(param, "UserData")).toBe(true);
        });

        it("should return true for exact type match with different parameter name", () => {
            const param = createParameterFromSource("config: Configuration");

            expect(isParameter(param, "Configuration")).toBe(true);
        });

        it("should return true for single character type", () => {
            const param = createParameterFromSource("value: T");

            expect(isParameter(param, "T")).toBe(true);
        });

        it("should return true for type with numbers", () => {
            const param = createParameterFromSource("item: Item2D");

            expect(isParameter(param, "Item2D")).toBe(true);
        });

        it("should return true for type with underscores", () => {
            const param = createParameterFromSource("data: User_Data");

            expect(isParameter(param, "User_Data")).toBe(true);
        });
    });

    describe("non-matching parameters", () => {
        it("should return false for different type", () => {
            const param = createParameterFromSource("data: UserData");

            expect(isParameter(param, "ConfigData")).toBe(false);
        });

        it("should return false for case-sensitive mismatch", () => {
            const param = createParameterFromSource("data: UserData");

            expect(isParameter(param, "userdata")).toBe(false);
        });

        it("should return false for partial type match", () => {
            const param = createParameterFromSource("data: UserDataConfig");

            expect(isParameter(param, "UserData")).toBe(false);
        });

        it("should return false for primitive types", () => {
            const param = createParameterFromSource("name: string");

            expect(isParameter(param, "string")).toBe(false);
        });

        it("should return false for number type", () => {
            const param = createParameterFromSource("count: number");

            expect(isParameter(param, "number")).toBe(false);
        });

        it("should return false for boolean type", () => {
            const param = createParameterFromSource("flag: boolean");

            expect(isParameter(param, "boolean")).toBe(false);
        });

        it("should return false for array types", () => {
            const param = createParameterFromSource("items: string[]");

            expect(isParameter(param, "string")).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should return false for parameter without type annotation", () => {
            const param = createParameterFromSource("param");

            expect(isParameter(param, "any")).toBe(false);
        });

        it("should return false for destructured parameter", () => {
            const param = createParameterFromSource("{ name, age }: UserData");

            expect(isParameter(param, "UserData")).toBe(false);
        });

        it("should return false for array destructured parameter", () => {
            const param = createParameterFromSource("[first, second]: string[]");

            expect(isParameter(param, "string")).toBe(false);
        });

        it("should return false for union type", () => {
            const param = createParameterFromSource("value: string | number");

            expect(isParameter(param, "string")).toBe(false);
        });

        it("should return false for intersection type", () => {
            const param = createParameterFromSource("obj: UserData & ConfigData");

            expect(isParameter(param, "UserData")).toBe(false);
        });

        it("should return false for function type", () => {
            const param = createParameterFromSource("callback: (x: number) => string");

            expect(isParameter(param, "Function")).toBe(false);
        });

        it("should return false for mapped type", () => {
            const sourceCode = `
                type MappedType = { [K in keyof UserData]: string };
                function test(param: MappedType) {}
            `;
            const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[1] as ts.FunctionDeclaration;
            const param = functionDeclaration.parameters[0];

            expect(isParameter(param, "MappedType")).toBe(false);
        });

        it("should return false for qualified type name", () => {
            const sourceCode = `
                namespace MyNamespace {
                    export type MyType = string;
                }
                function test(param: MyNamespace.MyType) {}
            `;
            const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[1] as ts.FunctionDeclaration;
            const param = functionDeclaration.parameters[0];

            expect(isParameter(param, "MyType")).toBe(false);
        });
    });

    describe("empty and null checks", () => {
        it("should return false when checking for empty string type", () => {
            const param = createParameterFromSource("data: UserData");

            expect(isParameter(param, "")).toBe(false);
        });

        it("should return false when type parameter is whitespace", () => {
            const param = createParameterFromSource("data: UserData");

            expect(isParameter(param, "   ")).toBe(false);
        });
    });

    describe("complex scenarios", () => {
        it("should handle optional parameters correctly", () => {
            const param = createParameterFromSource("data?: UserData");

            expect(isParameter(param, "UserData")).toBe(true);
        });

        it("should handle parameters with default values", () => {
            const param = createParameterFromSource("data: UserData = defaultValue");

            expect(isParameter(param, "UserData")).toBe(true);
        });

        it("should handle readonly parameters", () => {
            const param = createParameterFromSource("data: readonly UserData");

            expect(isParameter(param, "UserData")).toBe(false);
        });

        it("should distinguish between similar type names", () => {
            const param1 = createParameterFromSource("data: UserData");
            const param2 = createParameterFromSource("data: UserDataExtended");

            expect(isParameter(param1, "UserData")).toBe(true);
            expect(isParameter(param2, "UserData")).toBe(false);
            expect(isParameter(param2, "UserDataExtended")).toBe(true);
        });
    });
});
