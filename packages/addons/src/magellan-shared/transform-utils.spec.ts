/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { createObjectParameter, hasImport } from "./transform-utils";

describe("transform-utils", () => {
    describe("createObjectParameter", () => {
        it("should create an object parameter with destructuring", () => {
            // Create a regular parameter to objectify
            const originalParam = ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier("userId"),
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                undefined
            );

            // Call createObjectParameter
            const objectParam = createObjectParameter(ts.factory, originalParam);

            // Verify the result is a parameter declaration
            expect(objectParam.kind === ts.SyntaxKind.Parameter).toBe(true);

            // Verify it has an object binding pattern
            expect(objectParam.name.kind === ts.SyntaxKind.ObjectBindingPattern).toBe(true);

            // Verify it has a type literal node
            expect(objectParam.type !== undefined && objectParam.type.kind === ts.SyntaxKind.TypeLiteral).toBe(true);

            // Verify the binding pattern contains the original parameter name
            const bindingPattern = objectParam.name as ts.ObjectBindingPattern;
            expect(bindingPattern.elements).toHaveLength(1);
            expect(bindingPattern.elements[0].kind === ts.SyntaxKind.BindingElement).toBe(true);
            expect((bindingPattern.elements[0].name as ts.Identifier).text).toBe("userId");
        });
    });

    describe("hasImport", () => {
        it("should return true if the source file has Context import", () => {
            const sourceFile = ts.createSourceFile(
                "test.ts",
                `
                import { Context } from "@quatico/magellan-shared";
                `,
                ts.ScriptTarget.Latest,
                true
            );

            const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

            expect(result).toBe(true);
        });

        it("should return true if the source file has Context type import", () => {
            const sourceFile = ts.createSourceFile(
                "test.ts",
                `
                import { type Context } from "@quatico/magellan-shared";
                `,
                ts.ScriptTarget.Latest,
                true
            );

            const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

            expect(result).toBe(true);
        });

        it("should return true if the source file multiple valid type imports", () => {
            const sourceFile = ts.createSourceFile(
                "test.ts",
                `
                import { type Context, type Serialization } from "@quatico/magellan-shared";
                `,
                ts.ScriptTarget.Latest,
                true
            );

            const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

            expect(result).toBe(true);
        });

        it("should return true if the source file multiple valid imports", () => {
            const sourceFile = ts.createSourceFile(
                "test.ts",
                `
                import { Context, Serialization } from "@quatico/magellan-shared";
                `,
                ts.ScriptTarget.Latest,
                true
            );

            const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

            expect(result).toBe(true);
        });

        it("should return false if the source file doesn't have Context import", () => {
            const sourceFile = ts.createSourceFile(
                "test.ts",
                `
                import { something } from "@quatico/magellan-shared";
                `,
                ts.ScriptTarget.Latest,
                true
            );

            const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

            expect(result).toBe(false);
        });

        it("should return false if the source file imports Context from a different module", () => {
            // Create a source file with Context import from a different module
            const sourceFile = ts.createSourceFile(
                "test.ts",
                `
                import { type Context } from "@quatico/different-module";
                `,
                ts.ScriptTarget.Latest,
                true
            );

            const result = hasImport(sourceFile, "@quatico/magellan-shared", "Context");

            expect(result).toBe(false);
        });
    });
});
