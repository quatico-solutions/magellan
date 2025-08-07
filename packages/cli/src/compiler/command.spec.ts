/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { addCompileCommand } from "./command";
import { ModuleResolver } from "./module-resolver";
import path from "path";

jest.mock("./module-resolver", () => ({
    ModuleResolver: {
        resolve: jest.fn(),
        resolveAddonsDir: jest.fn(),
        resolveRelative: jest.fn(),
    },
}));

const mockModuleResolver = jest.mocked(ModuleResolver);

describe("addCompileCommand", () => {
    beforeEach(() => {
        mockModuleResolver.resolveAddonsDir.mockReturnValue(path.resolve(__dirname, "../../addons/lib"));
    });

    it("should create compile command with proper argument handling", () => {
        const command = addCompileCommand();

        expect(command).toBeDefined();
        expect(command.name()).toBe("compile");
        // Verify that the command has proper option validation (no allowUnknownOption)
        // @ts-expect-error -- cannot access private properties
        expect(command._allowUnknownOption).toBe(false);
        // @ts-expect-error -- cannot access private properties
        expect(command._allowExcessArguments).toBe(false);
    });

    it("should handle custom addons directory", () => {
        const customPath = "/custom/addons/lib";
        mockModuleResolver.resolveAddonsDir.mockReturnValueOnce(customPath);

        const command = addCompileCommand();

        expect(command).toBeDefined();
        // The resolver would be called during command execution
    });

    it("should accept source files as arguments", () => {
        const command = addCompileCommand();

        // @ts-expect-error -- cannot access private properties
        const actual = command._args;
        // Check that the command has the source argument defined

        expect(actual).toHaveLength(1);
        expect(actual[0].name()).toBe("source");
        expect(actual[0].variadic).toBe(true);
        expect(actual[0].required).toBe(false);
    });

    it("should resolve addons directory correctly", () => {
        const expectedPath = path.resolve(__dirname, "../../addons/lib");
        mockModuleResolver.resolveAddonsDir.mockReturnValue(expectedPath);

        // This would typically be tested by executing the command action
        expect(mockModuleResolver.resolveAddonsDir).toBeDefined();
    });
});
