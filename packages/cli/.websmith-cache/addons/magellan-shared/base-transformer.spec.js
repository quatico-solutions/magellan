"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = __importDefault(require("typescript"));
const base_transformer_1 = require("./base-transformer");
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
const addon_helpers_1 = require("./addon-helpers");
describe("createBaseTransformer", () => {
    let mockAddonContext;
    let mockReportDiagnostic;
    let mockFileExists;
    let mockGetCliArgs;
    let mockGetProfileConfig;
    let mockGetSystem;
    let mockAddonFn;
    let mockTransformer;
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
                target: typescript_1.default.ScriptTarget.ES2020,
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
        };
        mockTransformer.mockImplementation((node) => node);
        mockAddonFn.mockReturnValue(() => mockTransformer);
        // Reset mocks
        addon_helpers_1.isTsAddonApplicable.mockReset();
        typescript_1.default.transform.mockReset();
        typescript_1.default.createSourceFile.mockReset();
        typescript_1.default.createPrinter.mockReset();
        mockFileExists.mockReturnValue(true);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("early return cases", () => {
        it("should return original content when addon is not applicable", () => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(false);
            const result = (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(testContent);
            expect(addon_helpers_1.isTsAddonApplicable).toHaveBeenCalledWith(testFileName, mockAddonContext.getCliArgs());
            expect(mockAddonFn).not.toHaveBeenCalled();
        });
        it("should return original content for .d.ts files", () => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(true);
            const dtsFileName = "/path/to/types.d.ts";
            const dtsContent = "declare const x: number;";
            const result = (0, base_transformer_1.createBaseTransformer)(dtsFileName, dtsContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(dtsContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
        });
        it("should handle case-insensitive .d.ts extension", () => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(true);
            const dtsFileName = "/path/to/types.d.ts";
            const dtsContent = "declare const x: number;";
            const result = (0, base_transformer_1.createBaseTransformer)(dtsFileName, dtsContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(dtsContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
            expect(typescript_1.default.transform).not.toHaveBeenCalled(); // Should not transform .d.ts files
        });
    });
    describe("error handling", () => {
        beforeEach(() => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(true);
        });
        it("should throw error when source file does not exist", () => {
            mockFileExists.mockReturnValue(false);
            expect(() => {
                (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            }).toThrow(`${addonName} (${testFileName}) could not find source file`);
        });
        it("should return original content when profileConfig is missing", () => {
            mockGetProfileConfig.mockReturnValue(null);
            const result = (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(testContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
        });
        it("should return original content when profileConfig is undefined", () => {
            mockGetProfileConfig.mockReturnValue(undefined);
            const result = (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(testContent);
            expect(mockAddonFn).not.toHaveBeenCalled();
        });
    });
    describe("successful transformation", () => {
        beforeEach(() => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(true);
        });
        it("should transform source file and return printed result", () => {
            const transformedContent = "const y = 2;";
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            // Create a different object for the transformed result to simulate actual transformation
            const mockTransformedSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [],
            };
            const mockPrinter = {
                printFile: jest.fn().mockReturnValue(transformedContent),
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue(mockPrinter);
            const result = (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(transformedContent);
            expect(typescript_1.default.createSourceFile).toHaveBeenCalledWith(testFileName, testContent, typescript_1.default.ScriptTarget.ES2020, true);
            expect(typescript_1.default.transform).toHaveBeenCalledWith(mockSourceFile, [expect.any(Function)], {
                target: typescript_1.default.ScriptTarget.ES2020,
            });
            expect(mockPrinter.printFile).toHaveBeenCalledWith(mockTransformedSourceFile);
        });
        it("should use default target when not specified in options", () => {
            mockGetCliArgs.mockReturnValue({
                options: {},
                fileNames: [testFileName],
            });
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformedSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });
            (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(typescript_1.default.createSourceFile).toHaveBeenCalledWith(testFileName, testContent, typescript_1.default.ScriptTarget.Latest, true);
        });
        it("should report diagnostics when transformation produces them", () => {
            const mockDiagnostic = {
                messageText: "Test diagnostic",
                category: typescript_1.default.DiagnosticCategory.Warning,
            };
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformedSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [mockDiagnostic],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });
            (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(mockReportDiagnostic).toHaveBeenCalledWith(mockDiagnostic);
        });
        it("should not report diagnostics when none are present", () => {
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformedSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockTransformedSourceFile],
                diagnostics: [],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });
            (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(mockReportDiagnostic).not.toHaveBeenCalled();
        });
    });
    describe("edge cases", () => {
        beforeEach(() => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(true);
        });
        it("should return original content when no transformed file is found", () => {
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [],
                diagnostics: [],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            const result = (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(testContent);
        });
        it("should handle empty content", () => {
            const emptyContent = "";
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockSourceFile],
                diagnostics: [],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue({
                printFile: jest.fn().mockReturnValue(emptyContent),
            });
            const result = (0, base_transformer_1.createBaseTransformer)(testFileName, emptyContent, mockAddonContext, addonName, mockAddonFn);
            expect(result).toBe(emptyContent);
        });
    });
    describe("integration with addon function", () => {
        beforeEach(() => {
            addon_helpers_1.isTsAddonApplicable.mockReturnValue(true);
        });
        it("should pass correct context to addon function", () => {
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockSourceFile],
                diagnostics: [],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });
            (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(mockAddonFn).toHaveBeenCalledWith(mockAddonContext);
        });
        it("should pass compiler options to transform", () => {
            const customTarget = typescript_1.default.ScriptTarget.ES2018;
            mockGetCliArgs.mockReturnValue({
                options: {
                    target: customTarget,
                },
                fileNames: [testFileName],
            });
            const mockSourceFile = { fileName: testFileName, kind: typescript_1.default.SyntaxKind.SourceFile };
            const mockTransformResult = {
                transformed: [mockSourceFile],
                diagnostics: [],
            };
            typescript_1.default.createSourceFile.mockReturnValue(mockSourceFile);
            typescript_1.default.transform.mockReturnValue(mockTransformResult);
            typescript_1.default.createPrinter.mockReturnValue({
                printFile: jest.fn().mockReturnValue("transformed"),
            });
            (0, base_transformer_1.createBaseTransformer)(testFileName, testContent, mockAddonContext, addonName, mockAddonFn);
            expect(typescript_1.default.transform).toHaveBeenCalledWith(mockSourceFile, [expect.any(Function)], {
                target: customTarget,
            });
        });
    });
});
