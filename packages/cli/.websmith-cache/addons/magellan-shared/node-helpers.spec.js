"use strict";
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const node_helpers_1 = require("./node-helpers");
const setupNode = ({ kind, source }) => {
    const sf = (0, typescript_1.createSourceFile)("test.ts", source, typescript_1.ScriptTarget.Latest);
    const target = (0, node_helpers_1.getDescendantsOfKind)(sf, kind);
    if (!target) {
        throw new Error("testObj not defined");
    }
    return { target, sf };
};
describe("isNodeExported", () => {
    it("returns true w/ exported statement", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `export const target = "whatever";`,
        });
        expect((0, node_helpers_1.isNodeExported)(target)).toBe(true);
    });
    it("returns false wi/ not exported statement", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `const target = "whatever";`,
        });
        expect((0, node_helpers_1.isNodeExported)(target)).toBe(false);
    });
});
describe("isTransformable", () => {
    it("returns true w/ exported arrow variable statement", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `export const target = () => "whatever";`,
        });
        expect((0, node_helpers_1.isTransformable)(target)).toBe(true);
    });
    it("returns true w/ exported function declaration", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.FunctionDeclaration,
            source: `export function target() { return "whatever"; }`,
        });
        expect((0, node_helpers_1.isTransformable)(target)).toBe(true);
    });
    it("returns false wi/ if a const assignement", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `const target = "whatever";`,
        });
        expect((0, node_helpers_1.isTransformable)(target)).toBe(false);
    });
});
describe("getDecoration", () => {
    let mockContext;
    beforeEach(() => {
        mockContext = {
            getReporter: () => ({
                reportDiagnostic: jest.fn(),
                reportWatchStatus: jest.fn(),
                indent: jest.fn(),
                unindent: jest.fn(),
            }),
            getConfiguration: () => ({
                namespace: "default",
            }),
        };
    });
    it("returns local kind metadata w/ arrow function and empty call annotation", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
                // @service()
                export const target = () => "whatever";
            `,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toEqual({ kind: "local", namespace: "default" });
    });
    it("returns local kind metadata w/ arrow function calling a helper function", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
                function helper() { return "helper"; }

                // @service()
                export const target = () => helper();
            `,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toEqual({ kind: "local", namespace: "default" });
    });
    it("returns local kind metadata w/ arrow function calling another exported function", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
            // @service()
            export const target = () => helper();

            export function helper() { return "helper"; }
            `,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toEqual({ kind: "local", namespace: "default" });
    });
    it("returns external kind metadata w/ arrow function and external call annotation", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
                // @service({"kind": "external"})
                export const target = () => "whatever";
            `,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toEqual({ kind: "external", namespace: "default" });
    });
    it("returns undefined and error w/ arrow function without annotation", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
            // @service({"kind": "invalid"})
            export const target = () => "whatever";`,
        });
        const mockReportDiagnostic = jest.fn();
        mockContext.getReporter = () => ({
            reportDiagnostic: mockReportDiagnostic,
            reportWatchStatus: jest.fn(),
            indent: jest.fn(),
            unindent: jest.fn(),
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toBeUndefined();
        expect(mockReportDiagnostic).toHaveBeenCalled();
    });
    it("returns undefined if the 'service' decorator is not present", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
            export const target = () => helper();

            export function helper() { return "helper"; }
            `,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toBeUndefined();
    });
    it("returns undefined if the 'service' decorator is not correctly formatted", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `
                // service but not @ service()
                export const target = () => "helper";
            `,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toBeUndefined();
    });
    it("returns undefined w/ arrow function without annotation", () => {
        const { target, sf } = setupNode({
            kind: typescript_1.SyntaxKind.VariableStatement,
            source: `export const target = () => "whatever";`,
        });
        expect((0, node_helpers_1.getDecoration)(sf, target, "service", mockContext)).toBeUndefined();
    });
});
describe("getFunctionName", () => {
    it("returns the function name w/ an ArrowFunction node", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.VariableDeclaration,
            source: `
                // @service
                export const expected = () => "whatever";
            `,
        });
        expect((0, node_helpers_1.getFunctionName)(target)).toBe("expected");
    });
    it("returns the function name w/ a FunctionDeclaration node", () => {
        const { target } = setupNode({
            kind: typescript_1.SyntaxKind.FunctionDeclaration,
            source: `
                // @service
                export async function expected() { return "whatever"; }
            `,
        });
        expect((0, node_helpers_1.getFunctionName)(target)).toBe("expected");
    });
    it("throws an error if the function name is not found", () => {
        const sf = (0, typescript_1.createSourceFile)("test.ts", "", typescript_1.ScriptTarget.Latest);
        expect(() => (0, node_helpers_1.getFunctionName)(sf)).toThrow("getFunctionName failed, no function or arrow function node provided.");
    });
});
