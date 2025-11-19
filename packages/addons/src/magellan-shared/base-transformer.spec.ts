/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import ts from "typescript";
import { createBaseTransformer } from "./base-transformer";
import { type MagellanConfig } from "./magellan-config";

// Mock the addon-helpers module
jest.mock("./addon-helpers", () => ({
    isTsAddonApplicable: jest.fn(),
}));

// Mock TypeScript module
jest.mock("typescript", () => {
    const actualTs = jest.requireActual("typescript");
    return {
        ...actualTs,
        transform: jest.fn(),
        createSourceFile: jest.fn(),
        createPrinter: jest.fn(),
    };
});

import { isTsAddonApplicable } from "./addon-helpers";

describe("createBaseTransformer", () => {
    let mockAddonContext: AddonContext<MagellanConfig>;
    let mockReportDiagnostic: jest.Mock;
    let mockFileExists: jest.Mock;
    let mockGetCliArgs: jest.Mock;
    let mockGetProfileConfig: jest.Mock;
    let mockGetSystem: jest.Mock;
    let mockAddonFn: jest.Mock;
    let mockTransformer: jest.Mock;

    const testFileName = "/path/to/test.ts";
    const testContent = "const x = 1;";
    const addonName = "TestAddon";

    beforeEach(() => {
        mockReportDiagnostic = jest.fn();
        mockFileExists = jest.fn();
        mockGetCliArgs = jest.fn();
        mockGetProfileConfig = jest.fn();
        mockGetSystem = jest.fn();
        mockTransformer = jest.fn();
        mockAddonFn = jest.fn();

        mockGetSystem.mockReturnValue({
            fileExists: mockFileExists,
        });

        mockGetCliArgs.mockReturnValue({
            options: {
                target: ts.ScriptTarget.ES2020,
            },
            fileNames: [testFileName],
        });

        mockGetProfileConfig.mockReturnValue({
            hostname: "localhost",
            port: 3000,
        });

        mockAddonContext = {
            getReporter: () => ({
                reportDiagnostic: mockReportDiagnostic,
                reportWatchStatus: jest.fn(),
                indent: jest.fn(),
                unindent: jest.fn(),
            }),
            getSystem: mockGetSystem,
            getCliArgs: mockGetCliArgs,
            getProfileConfig: mockGetProfileConfig,
        } as any;

        mockTransformer.mockImplementation((node: ts.Node) => node);
        mockAddonFn.mockReturnValue(() => mockTransformer);

        // Reset mocks
        (isTsAddonApplicable as jest.Mock).mockReset();
        (ts.transform as jest.Mock).mockReset();
        (ts.createSourceFile as jest.Mock).mockReset();
        (ts.createPrinter as jest.Mock).mockReset();
        mockFileExists.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("early return cases", () => {
        it("should return original content when addon is not applicable", () => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(false);

            const result = createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(testContent);
            expect(isTsAddonApplicable).toHaveBeenCalledWith(testFileName, mockAddonContext.getCliArgs());
            expect(mockAddonFn).not.toHaveBeenCalled();
        });

        it("should return original content for .d.ts files", () => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(true);
            const dtsFileName = "/path/to/types.d.ts";
            const dtsContent = "declare const x: number;";

            const result = createBaseTransformer(dtsFileName, dtsContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(dtsContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
        });

        it("should handle case-insensitive .d.ts extension", () => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(true);
            const dtsFileName = "/path/to/types.d.ts";
            const dtsContent = "declare const x: number;";

            const result = createBaseTransformer(dtsFileName, dtsContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(dtsContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
            expect(ts.transform).not.toHaveBeenCalled(); // Should not transform .d.ts files
        });
    });

    describe("error handling", () => {
        beforeEach(() => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(true);
        });

        it("should throw error when source file does not exist", () => {
            mockFileExists.mockReturnValue(false);

            expect(() => {
                createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            }).toThrow(`${addonName} (${testFileName}) could not find source file`);
        });

        it("should return original content when profileConfig is missing", () => {
            mockGetProfileConfig.mockReturnValue(null);

            const result = createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(testContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
        });

        it("should return original content when profileConfig is undefined", () => {
            mockGetProfileConfig.mockReturnValue(undefined);

            const result = createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(testContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
        });
    });

    describe("successful transformation", () => {
        beforeEach(() => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(true);
        });

        it("should transform source file and return printed result", () => {
            const transformedContent = "const y = 2;";
            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            // Create a different object for the transformed result to simulate actual transformation
            const mockTransformedSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [],
            };
            const mockPrinter = {
                printFile: jest.fn().mockReturnValue(transformedContent),
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue(mockPrinter);

            const result = createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(transformedContent);
            expect(ts.createSourceFile).toHaveBeenCalledWith(testFileName, testContent, ts.ScriptTarget.ES2020, true);
            expect(ts.transform).toHaveBeenCalledWith(mockSourceFile, [expect.any(Function)], {
                target: ts.ScriptTarget.ES2020,
            });
            expect(mockPrinter.printFile).toHaveBeenCalledWith(mockTransformedSourceFile);
        });

        it("should use default target when not specified in options", () => {
            mockGetCliArgs.mockReturnValue({
                options: {},
                fileNames: [testFileName],
            });

            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformedSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });

            createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(ts.createSourceFile).toHaveBeenCalledWith(testFileName, testContent, ts.ScriptTarget.Latest, true);
        });

        it("should report diagnostics when transformation produces them", () => {
            const mockDiagnostic = {
                messageText: "Test diagnostic",
                category: ts.DiagnosticCategory.Warning,
            } as ts.Diagnostic;
            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformedSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [mockDiagnostic],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });

            createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(mockReportDiagnostic).toHaveBeenCalledWith(mockDiagnostic);
        });

        it("should not report diagnostics when none are present", () => {
            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformedSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });

            createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(mockReportDiagnostic).not.toHaveBeenCalled();
        });
    });

    describe("edge cases", () => {
        beforeEach(() => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(true);
        });

        it("should return original content when no transformed file is found", () => {
            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [],
                diagnostics: [],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);

            const result = createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(testContent);
        });

        it("should handle empty content", () => {
            const emptyContent = "";
            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockSourceFile],
                diagnostics: [],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue({
                printFile: jest.fn().mockReturnValue(emptyContent),
            });

            const result = createBaseTransformer(testFileName, emptyContent, mockAddonContext, addonName, mockAddonFn);

            expect(result).toBe(emptyContent);
        });
    });

    describe("integration with addon function", () => {
        beforeEach(() => {
            (isTsAddonApplicable as jest.Mock).mockReturnValue(true);
        });

        it("should pass correct context to addon function", () => {
            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockSourceFile],
                diagnostics: [],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });

            createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(mockAddonFn).toHaveBeenCalledWith(mockAddonContext);
        });

        it("should pass compiler options to transform", () => {
            const customTarget = ts.ScriptTarget.ES2018;
            mockGetCliArgs.mockReturnValue({
                options: {
                    target: customTarget,
                },
                fileNames: [testFileName],
            });

            const mockSourceFile = { fileName: testFileName, kind: ts.SyntaxKind.SourceFile } as ts.SourceFile;
            const mockTransformResult = {
                transformed: [mockSourceFile],
                diagnostics: [],
            };

            (ts.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);
            (ts.transform as jest.Mock).mockReturnValue(mockTransformResult);
            (ts.createPrinter as jest.Mock).mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });

            createBaseTransformer(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);

            expect(ts.transform).toHaveBeenCalledWith(mockSourceFile, [expect.any(Function)], {
                target: customTarget,
            });
        });
    });
});
