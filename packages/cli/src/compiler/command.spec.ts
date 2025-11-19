/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { Compiler, createSystem, NoReporter } from "@quatico/websmith-core";
import { Command } from "commander";
import ts from "typescript";
import { addCompileCommand } from "./command";

describe("addCompileCommand", () => {
    let mockStderrWrite: jest.SpyInstance;
    beforeEach(() => {
        jest.clearAllMocks();

        mockStderrWrite = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    });

    afterEach(() => {
        mockStderrWrite.mockRestore();
    });

    describe("Command Structure", () => {
        it("should create compile command with proper basic setup", () => {
            const command = addCompileCommand(new Command());

            expect(command).toBeDefined();
            expect(command.name()).toBe("compile");
            expect(command.description()).toBe("Compile TypeScript functions annotated with @service() for client and server use with Magellan");
            // Verify that the command has proper option validation (no allowUnknownOption)
            // @ts-expect-error -- cannot access private properties
            expect(command._allowUnknownOption).toBe(false);
            // @ts-expect-error -- cannot access private properties
            expect(command._allowExcessArguments).toBe(false);
        });

        it("should accept source files as variadic arguments", () => {
            const command = addCompileCommand(new Command());

            // @ts-expect-error -- cannot access private properties
            const actual = command._args;
            expect(actual).toHaveLength(1);
            expect(actual[0].name()).toBe("source");
            expect(actual[0].variadic).toBe(true);
            expect(actual[0].required).toBe(false);
        });
    });

    describe("CLI Options", () => {
        let command: Command;

        beforeEach(() => {
            command = addCompileCommand(new Command());
        });

        it("should have all expected CLI options defined", () => {
            // Test the command help output to verify options are defined
            const helpOutput = command.helpInformation();

            // Configuration options
            expect(helpOutput).toContain("--configFile");
            expect(helpOutput).toContain("--project");

            // Mode options
            expect(helpOutput).toContain("--client");
            expect(helpOutput).toContain("--server");
            expect(helpOutput).toContain("--debug");
            expect(helpOutput).toContain("--transpileOnly");
            expect(helpOutput).toContain("--addonEmitOnly");
            expect(helpOutput).toContain("--watch");

            // TypeScript compiler options
            expect(helpOutput).toContain("--target");
            expect(helpOutput).toContain("--module");
            expect(helpOutput).toContain("--lib");
            expect(helpOutput).toContain("--allowJs");
            expect(helpOutput).toContain("--checkJs");
            expect(helpOutput).toContain("--jsx");
            expect(helpOutput).toContain("--declaration");
            expect(helpOutput).toContain("--declarationMap");
            expect(helpOutput).toContain("--emitDeclarationOnly");
            expect(helpOutput).toContain("--sourceMap");
            expect(helpOutput).toContain("--noEmit");
            expect(helpOutput).toContain("--outFile");
            expect(helpOutput).toContain("--outDir");
            expect(helpOutput).toContain("--removeComments");
            expect(helpOutput).toContain("--strict");
            expect(helpOutput).toContain("--types");
            expect(helpOutput).toContain("--esModuleInterop");

            // Build options
            expect(helpOutput).toContain("--init");
            expect(helpOutput).toContain("--showConfig");
            expect(helpOutput).toContain("--build");
            expect(helpOutput).toContain("--pretty");
        });

        it("should have proper short option aliases", () => {
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("-c, --configFile");
            expect(helpOutput).toContain("-p, --project");
            expect(helpOutput).toContain("-o, --transpileOnly");
            expect(helpOutput).toContain("-w, --watch");
            expect(helpOutput).toContain("-t, --target");
            expect(helpOutput).toContain("-m, --module");
            expect(helpOutput).toContain("-d, --declaration");
            expect(helpOutput).toContain("-b, --build");
        });
    });

    describe("Option Validation", () => {
        it("should create command that accepts --client and --server options", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("--client");
            expect(helpOutput).toContain("--server");
            expect(helpOutput).toContain("Generate client-side proxies for service");
            expect(helpOutput).toContain("Generate server-side remote functions");
        });
    });

    describe("Source Files Handling", () => {
        it("should accept variadic source arguments", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("[source...]");
            expect(helpOutput).toContain("Source directory or files to compile");
        });
    });

    describe("Option Descriptions", () => {
        it("should have proper descriptions for compilation options", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("Enable watch mode");
            expect(helpOutput).toContain("Enable the output of debug information");
            expect(helpOutput).toContain("Skip type checking for faster compilation");
            expect(helpOutput).toContain("Only emit transformed files");
            expect(helpOutput).toContain("Auto-enabled with --client or --server");
            expect(helpOutput).toContain('path to the "./websmith.config.json" file');
        });

        it("should have proper descriptions for TypeScript options", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("Set the JavaScript language version");
            expect(helpOutput).toContain("Specify what module code is generated");
            expect(helpOutput).toContain("Generate .d.ts files");
            expect(helpOutput).toContain("Create source map files");
            expect(helpOutput).toContain("Enable all strict type-checking options");
        });

        it("should have proper descriptions for build options", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("Initializes a TypeScript project");
            expect(helpOutput).toContain("Print the final configuration");
            expect(helpOutput).toContain("Build one or more projects");
            expect(helpOutput).toContain("Enable color and formatting");
        });
    });

    describe("Option Values", () => {
        it("should document TypeScript target values", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("es5");
            expect(helpOutput).toContain("es2015");
            expect(helpOutput).toContain("es2020");
            expect(helpOutput).toContain("esnext");
        });

        it("should document module system values", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("commonjs");
            expect(helpOutput).toContain("amd");
            expect(helpOutput).toContain("umd");
            expect(helpOutput).toContain("system");
        });

        it("should document JSX values", () => {
            const command = addCompileCommand(new Command());
            const helpOutput = command.helpInformation();

            expect(helpOutput).toContain("preserve");
            expect(helpOutput).toContain("react");
            expect(helpOutput).toContain("react-jsx");
        });
    });

    describe("CLI argument handling", () => {
        let compiler: Compiler;

        beforeEach(() => {
            // Create a virtual tsconfig.json with default settings

            compiler = new Compiler(
                { reporter: new NoReporter() },
                undefined,
                createSystem(
                    {
                        "./tsconfig.json": JSON.stringify({
                            compilerOptions: {
                                target: "es5", // Default target that can be overridden
                                module: "commonjs", // Default module that can be overridden
                                outDir: "./dist", // Default outDir
                                sourceMap: false, // Default sourceMap
                                declaration: false, // Default declaration
                                strict: false, // Default strict
                                declarationMap: false, // Default declarationMap
                                emitDeclarationOnly: false, // Default emitDeclarationOnly
                                noEmit: false, // Default noEmit
                                outFile: false, // Default outFile
                                removeComments: false, // Default removeComments
                                esModuleInterop: false, // Default esModuleInterop
                                allowJs: false, // Default allowJs
                            },
                            include: ["src/**/*"],
                            exclude: ["node_modules"],
                        }),
                    },
                    { virtual: true }
                )
            );
        });

        describe("Boolean Options", () => {
            it("should handle --debug flag", () => {
                executeCompiler("--debug", compiler);

                expect(compiler.getOptions().tsConfig!.listFiles).toBe(true);
            });

            it("should handle --strict flag", () => {
                executeCompiler("--strict", compiler);

                expect(compiler.getOptions().tsConfig!.strict).toBe(true);
            });

            it("should handle --declaration flag", () => {
                executeCompiler("--declaration", compiler);

                expect(compiler.getOptions().tsConfig!.declaration).toBe(true);
            });

            it("should handle --sourceMap flag", () => {
                executeCompiler("--sourceMap", compiler);

                expect(compiler.getOptions().tsConfig!.sourceMap).toBe(true);
            });

            it("should handle --transpileOnly flag", () => {
                executeCompiler("--transpileOnly", compiler);

                expect(compiler.getOptions().tsConfig!.transpileOnly).toBe(true);
            });

            it("should handle --addonEmitOnly flag", () => {
                executeCompiler("--addonEmitOnly", compiler);

                expect(compiler.getOptions().config?.addonEmitOnly).toBe(true);
            });

            it("should handle multiple boolean flags together", () => {
                executeCompiler("--debug --strict --declaration", compiler);

                expect(compiler.getOptions().tsConfig!.listFiles).toBe(true);
                expect(compiler.getOptions().tsConfig!.strict).toBe(true);
                expect(compiler.getOptions().tsConfig!.declaration).toBe(true);
            });
        });

        describe("String Options", () => {
            it("should handle --project option", () => {
                executeCompiler("--project ./tsconfig.json", compiler);

                expect(compiler.getOptions().tsConfigFile).toBe("/tsconfig.json");
            });

            it("should accept --outDir option without errors", () => {
                executeCompiler("--project ./tsconfig.json --outDir ./custom-dist", compiler);

                // The outDir may be resolved to an absolute path
                expect(compiler.getOptions().tsConfig!.outDir).toMatch(/^.*\/custom-dist/);
            });

            it("should accept --target option without errors", () => {
                executeCompiler("--project ./tsconfig.json --target es2020", compiler);

                // TypeScript converts "es2020" to ScriptTarget.ES2020 which is 7
                expect(compiler.getOptions().tsConfig!.target).toBe(ts.ScriptTarget.ES2020);
            });

            it("should accept --module option without errors", () => {
                executeCompiler("--project ./tsconfig.json --module commonjs", compiler);

                // TypeScript converts "commonjs" to ModuleKind.CommonJS which is 1
                expect(compiler.getOptions().tsConfig!.module).toBe(ts.ModuleKind.CommonJS);
            });
        });

        describe("Short Options", () => {
            it("should handle -d (declaration) short option", () => {
                executeCompiler("--project ./tsconfig.json -d", compiler);

                expect(compiler.getOptions().tsConfig!.declaration).toBe(true);
            });

            it("should accept -t (target) short option without errors", () => {
                executeCompiler("--project ./tsconfig.json -t es2021", compiler);

                // TypeScript converts "es2021" to ScriptTarget.ES2021 which is 8
                expect(compiler.getOptions().tsConfig!.target).toBe(ts.ScriptTarget.ES2021);
            });

            it("should accept -o (transpileOnly) short option without errors", () => {
                executeCompiler("--project ./tsconfig.json -o", compiler);

                expect(compiler.getOptions().tsConfig!.transpileOnly).toBe(true);
            });
        });

        describe("Profile Options", () => {
            it("should handle --client option", () => {
                executeCompiler("--client", compiler);

                expect(compiler.getOptions().profile).toBe("client");
                expect(compiler.getOptions().config?.profiles?.client?.addons).toEqual(["client-function-transform"]);
            });

            it("should handle --server option", () => {
                executeCompiler("--server", compiler);

                expect(compiler.getOptions().profile).toBe("server");
                expect(compiler.getOptions().config?.profiles?.server?.addons).toEqual(["service-function-generate"]);
            });
        });

        describe("Option Combinations", () => {
            it("should handle mixed short and long options", () => {
                executeCompiler("--project ./tsconfig.json --strict -d", compiler);

                expect(compiler.getOptions().tsConfig!.strict).toBe(true);
                expect(compiler.getOptions().tsConfig!.declaration).toBe(true);
            });

            it("should handle client profile with TypeScript options", () => {
                executeCompiler("--project ./tsconfig.json --client --strict", compiler);

                expect(compiler.getOptions().profile).toBe("client");
                expect(compiler.getOptions().tsConfig!.strict).toBe(true);
            });

            it("should handle server profile with build options", () => {
                executeCompiler("--project ./tsconfig.json --server --declaration", compiler);

                expect(compiler.getOptions().profile).toBe("server");
                expect(compiler.getOptions().tsConfig!.declaration).toBe(true);
            });

            it("should handle client profile with addonEmitOnly", () => {
                executeCompiler("--project ./tsconfig.json --client --addonEmitOnly", compiler);

                expect(compiler.getOptions().profile).toBe("client");
                expect(compiler.getOptions().config?.addonEmitOnly).toBe(true);
                expect(compiler.getOptions().config?.profiles?.client?.addons).toEqual(["client-function-transform"]);
            });

            it("should handle server profile with addonEmitOnly", () => {
                executeCompiler("--project ./tsconfig.json --server --addonEmitOnly", compiler);

                expect(compiler.getOptions().profile).toBe("server");
                expect(compiler.getOptions().config?.addonEmitOnly).toBe(true);
                expect(compiler.getOptions().config?.profiles?.server?.addons).toEqual(["service-function-generate"]);
            });

            it("should handle client profile with transpileOnly", () => {
                executeCompiler("--project ./tsconfig.json --client --transpileOnly", compiler);

                expect(compiler.getOptions().profile).toBe("client");
                expect(compiler.getOptions().tsConfig!.transpileOnly).toBe(true);
                expect(compiler.getOptions().config?.profiles?.client?.addons).toEqual(["client-function-transform"]);
            });

            it("should handle server profile with transpileOnly", () => {
                executeCompiler("--project ./tsconfig.json --server --transpileOnly", compiler);

                expect(compiler.getOptions().profile).toBe("server");
                expect(compiler.getOptions().tsConfig!.transpileOnly).toBe(true);
                expect(compiler.getOptions().config?.profiles?.server?.addons).toEqual(["service-function-generate"]);
            });

            it("should handle client profile with both addonEmitOnly and transpileOnly", () => {
                executeCompiler("--project ./tsconfig.json --client --addonEmitOnly --transpileOnly", compiler);

                expect(compiler.getOptions().profile).toBe("client");
                expect(compiler.getOptions().config?.addonEmitOnly).toBe(true);
                expect(compiler.getOptions().tsConfig!.transpileOnly).toBe(true);
                expect(compiler.getOptions().config?.profiles?.client?.addons).toEqual(["client-function-transform"]);
            });

            it("should handle server profile with both addonEmitOnly and transpileOnly", () => {
                executeCompiler("--project ./tsconfig.json --server --addonEmitOnly --transpileOnly", compiler);

                expect(compiler.getOptions().profile).toBe("server");
                expect(compiler.getOptions().config?.addonEmitOnly).toBe(true);
                expect(compiler.getOptions().tsConfig!.transpileOnly).toBe(true);
                expect(compiler.getOptions().config?.profiles?.server?.addons).toEqual(["service-function-generate"]);
            });
        });
    });
});

const executeCompiler = (args = "", compiler?: Compiler) => {
    try {
        const command = addCompileCommand(new Command(), compiler);
        // Parse arguments like the existing tests do
        command.parse(
            args
                .split(" ")
                .map(it => it.trim())
                .filter(it => it !== ""),
            { from: "user" }
        );
    } catch (err: any) {
        // Only throw for actual errors, not for expected exits or compilation completion
        if (err.message && !err.message.includes("process.exit") && !err.message.includes("compilation")) {
            throw err;
        }
        // Swallow expected exits from successful compilation
    }
};
