/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import ts, { createSourceFile, Node, ScriptTarget, SyntaxKind } from "typescript";
import {
    getDecoration,
    getDescendantsOfKind,
    getFunctionName,
    hasDecorator,
    isNodeExported,
    isStatement,
    isTransformable,
    ServiceDecoratorData,
} from "./node-helpers";

interface SetupResult<T extends Node> {
    target: T;
    sf: ts.SourceFile;
}

const setupNode = <T extends Node>({ kind, source }: { kind: SyntaxKind; source: string }): SetupResult<T> => {
    const sf = createSourceFile("test.ts", source, ScriptTarget.Latest);
    const target = getDescendantsOfKind<T>(sf, kind);
    if (!target) {
        throw new Error("testObj not defined");
    }
    return { target, sf };
};

describe("isNodeExported", () => {
    it("returns true w/ exported statement", () => {
        const { target } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `export const target = "whatever";`,
        });

        expect(isNodeExported(target)).toBe(true);
    });

    it("returns false wi/ not exported statement", () => {
        const { target } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `const target = "whatever";`,
        });

        expect(isNodeExported(target)).toBe(false);
    });
});

describe("isTransformable", () => {
    it("returns true w/ exported arrow variable statement", () => {
        const { target } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `export const target = () => "whatever";`,
        });

        expect(isTransformable(target)).toBe(true);
    });

    it("returns true w/ exported function declaration", () => {
        const { target } = setupNode<ts.FunctionDeclaration>({
            kind: SyntaxKind.FunctionDeclaration,
            source: `export function target() { return "whatever"; }`,
        });

        expect(isTransformable(target)).toBe(true);
    });

    it("returns false wi/ if a const assignement", () => {
        const { target } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `const target = "whatever";`,
        });

        expect(isTransformable(target)).toBe(false);
    });
});

describe("getStatement", () => {
    it("returns true w/ assignment statement", () => {
        const { target } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `export const target = "whatever";`,
        });

        expect(isStatement(target)).toBe(true);
    });

    it("returns true w/ function declaration", () => {
        const { target } = setupNode<ts.FunctionDeclaration>({
            kind: SyntaxKind.FunctionDeclaration,
            source: `export async function computeDate() { return new Date(); }`,
        });

        expect(isStatement(target)).toBe(true);
    });

    it("returns false w/ string literal", () => {
        const target = ts.factory.createStringLiteral("target");

        expect(isStatement(target)).toBe(false);
    });
});

describe("hasDecorator", () => {
    it("returns true w/ function declaration and call annotation", () => {
        const { target, sf } = setupNode<ts.FunctionDeclaration>({
            kind: SyntaxKind.FunctionDeclaration,
            source: `
                // @service()
                export async function target() { return "whatever"; }
            `,
        });

        expect(hasDecorator(sf, target, "service")).toBe(true);
    });

    it("returns true w/ function declaration and non-call annotation", () => {
        const { target, sf } = setupNode<ts.FunctionDeclaration>({
            kind: SyntaxKind.FunctionDeclaration,
            source: `
                // @service
                export async function target() { return "whatever"; }
            `,
        });

        expect(hasDecorator(sf, target, "service")).toBe(true);
    });

    it("returns true w/ arrow function and call annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `
                // @service()
                export const target = () => "whatever";
            `,
        });

        expect(hasDecorator(sf, target, "service")).toBe(true);
    });

    it("returns true w/ arrow function and non-call annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `
                // @service
                export const target = () => "whatever";
            `,
        });

        expect(hasDecorator(sf, target, "service")).toBe(true);
    });

    it("returns false w/ arrow function without annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `export const target = () => "whatever";`,
        });

        expect(hasDecorator(sf, target, "service")).toBe(false);
    });
});

describe("getDecoration", () => {
    it("returns local kind metadata w/ arrow function and empty call annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `
                // @service()
                export const target = () => "whatever";
            `,
        });

        expect(getDecoration(sf, target, "service")).toEqual(<ServiceDecoratorData>{ kind: "local", namespace: "default" });
    });

    it("returns external kind metadata w/ arrow function and external call annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `
                // @service({"kind": "external"})
                export const target = () => "whatever";
            `,
        });

        expect(getDecoration(sf, target, "service")).toEqual(<ServiceDecoratorData>{ kind: "external", namespace: "default" });
    });

    it("returns undefined and error w/ arrow function without annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `
            // @service({"kind": "invalid"})
            export const target = () => "whatever";`,
        });
        // eslint-disable-next-line no-console
        console.error = jest.fn();

        expect(getDecoration(sf, target, "service")).toBeUndefined();
        // eslint-disable-next-line no-console
        expect(console.error).toHaveBeenCalledWith('Invalid service kind "invalid" provided. Must be empty, "local" or "external"');
    });

    it("returns undefined w/ arrow function without annotation", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `export const target = () => "whatever";`,
        });

        expect(getDecoration(sf, target, "service")).toBeUndefined();
    });
});

describe("getFunctionName", () => {
    it("returns the function name w/ an ArrowFunction node", () => {
        const { target, sf } = setupNode<ts.VariableStatement>({
            kind: SyntaxKind.VariableStatement,
            source: `
                // @service
                export const expected = () => "whatever";
            `,
        });

        expect(getFunctionName(target, sf)).toBe("expected");
    });

    it("returns the function name w/ a FunctionDeclaration node", () => {
        const { target, sf } = setupNode<ts.FunctionDeclaration>({
            kind: SyntaxKind.FunctionDeclaration,
            source: `
                // @service
                export async function expected() { return "whatever"; }
            `,
        });

        expect(getFunctionName(target, sf)).toBe("expected");
    });
});
