/* eslint-disable  @typescript-eslint/unbound-method */
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type CompilationConfig } from "@quatico/websmith-api";
import { Compiler, createSystem, NoReporter } from "@quatico/websmith-core";
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { addCompileCommand } from "./compiler/command";
import { ModuleResolver } from "./compiler/module-resolver";

// Create unique test directories for each test to prevent cross-test contamination
const getTestDirs = () => {
    const testId = expect.getState().currentTestName?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown";
    const timestamp = Date.now();
    const uniqueId = `${testId}_${timestamp}`;
    const PROJECT_DIR = path.resolve(__dirname, "..", `test-output-${uniqueId}`);
    const OUTPUT_DIR = path.resolve(PROJECT_DIR, "dist");
    const SOURCE_DIR = path.join(PROJECT_DIR, "src");
    return { PROJECT_DIR, OUTPUT_DIR, SOURCE_DIR };
};

const ADDONS_DIR = path.resolve(__dirname, "..", "..", "addons", "src");

jest.mock("./compiler/module-resolver", () => ({
    ModuleResolver: {
        resolve: jest.fn(),
        resolveAddonsDir: jest.fn(),
        resolveRelative: jest.fn(),
    },
}));

let testDirs: { PROJECT_DIR: string; OUTPUT_DIR: string; SOURCE_DIR: string };
const mockModuleResolver = jest.mocked(ModuleResolver);

describe("cli.ts", () => {
    let originalCwd: string;
    beforeAll(() => {
        // Verify that source addons exist
        if (!fs.existsSync(ADDONS_DIR)) {
            throw new Error(`Addons source directory not found: ${ADDONS_DIR}`);
        }
    });

    beforeEach(() => {
        // Generate unique test directories for this specific test
        testDirs = getTestDirs();

        jest.spyOn(process, "exit").mockImplementation(jest.fn() as any);
        jest.spyOn(console, "time").mockImplementation(() => {}); // Don't log timing information to console
        originalCwd = process.cwd();
        // Clean up and create test directories (unique for this test)
        try {
            fs.rmSync(path.resolve(testDirs.PROJECT_DIR), { recursive: true, force: true });
        } catch (_error) {
            // Ignore errors if directory doesn't exist
        }
        fs.mkdirSync(testDirs.SOURCE_DIR, { recursive: true });
        fs.mkdirSync(testDirs.OUTPUT_DIR, { recursive: true });

        mockModuleResolver.resolveAddonsDir.mockReturnValue(path.resolve(__dirname, "../../addons/lib"));
        mockModuleResolver.resolveAddonsDir.mockClear();
    });

    afterEach(() => {
        // Restore working directory safely
        try {
            if (originalCwd && originalCwd !== process.cwd()) {
                process.chdir(originalCwd);
            }
        } catch (error) {
            console.warn(`Failed to restore working directory: ${error}`);
        }

        // Clean up test directories (unique for this test)
        if (testDirs) {
            try {
                fs.rmSync(path.resolve(testDirs.PROJECT_DIR), { recursive: true, force: true });
            } catch (_error) {
                // Ignore cleanup errors
            }
        }
    });

    it("should create Command instance and call addCompileCommand", () => {
        const target = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

        executeCompiler("--help");

        // Verify that help text was written to stdout with correct program name
        expect(target).toHaveBeenCalledWith(expect.stringContaining("Usage: magellan compile [options] [source...]"));
    });

    it("should parse process.argv with debug and watch flags", () => {
        jest.spyOn(process.stdout, "write").mockImplementation(() => true);
        jest.spyOn(new NoReporter(), "reportDiagnostic").mockImplementation(() => {});

        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem({}, { virtual: true }));
        const watchSpy = jest.spyOn(target, "watch").mockImplementation(() => target);

        executeCompiler("--debug --watch", target);

        // Verify that watch method was called (for --watch flag)
        expect(watchSpy).toHaveBeenCalled();
        expect(target.getOptions()).toMatchObject({ tsConfig: { listFiles: true, watch: true }, debug: true });
    });

    it("should handle compilation arguments", () => {
        const target = new Compiler(
            { reporter: new NoReporter() },
            {},
            createSystem({ "./tsconfig.json": createTsConfig({ sourceMap: false }) }, { virtual: true })
        );
        executeCompiler("--project ./tsconfig.json --sourceMap", target);

        expect(target.getOptions()).toMatchObject({ tsConfig: { sourceMap: true, project: "./tsconfig.json" } });
    });

    it("should handle empty arguments", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem({}, { virtual: true }));
        executeCompiler("", target);

        expect(target.getOptions()).toEqual({
            buildDir: "/",
            cliArgs: {
                errors: [],
                fileNames: [],
                options: {
                    allowJs: false,
                    checkJs: false,
                    configFilePath: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                    declaration: false,
                    declarationMap: false,
                    emitDecorationOnly: false,
                    esModuleInterop: false,
                    jsx: 1,
                    noEmit: false,
                    pretty: true,
                    project: "./tsconfig.json",
                    removeComments: false,
                    strict: false,
                    target: 1,
                },
                raw: {
                    configFilePath: "/tsconfig.json",
                },
            },
            config: {
                addons: [],
                addonsDir: path.resolve(__dirname, "../../addons/lib"),
                profiles: {},
            },
            debug: false,
            profile: undefined,
            reporter: expect.any(NoReporter),
            system: expect.any(Object),
            tsConfig: {
                allowJs: false,
                checkJs: false,
                configFilePath: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                declaration: false,
                declarationMap: false,
                emitDecorationOnly: false,
                esModuleInterop: false,
                jsx: ts.JsxEmit.Preserve,
                noEmit: false,
                project: "./tsconfig.json",
                pretty: true,
                removeComments: false,
                strict: false,
                target: ts.ScriptTarget.ES5,
            },
            tsConfigFile: "/tsconfig.json",
            watch: false,
        });
    });

    it("should handle --client flag", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

        executeCompiler("--client", target);

        expect(target.getOptions().config).toEqual({
            addonsDir: path.resolve(__dirname, "../../addons/lib"),
            addons: [],
            transpileOnly: true,
            addonEmitOnly: true,
            profiles: {
                client: {
                    addons: ["client-function-transform"],
                },
            },
        });
        expect(target.getOptions().getAddons("client")).toEqual(["client-function-transform"]);
        // Since websmith 0.8.0, getAvailableAddons() only returns explicitly requested addons
        expect(target.getAddonRegistry()!.getAvailableAddons().getNames()).toEqual(["client-function-transform"]);
    });

    it("should handle --server flag", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

        executeCompiler("--server", target);

        expect(target.getOptions().config).toEqual({
            addonsDir: path.resolve(__dirname, "../../addons/lib"),
            addons: [],
            transpileOnly: true,
            addonEmitOnly: true,
            profiles: {
                server: {
                    addons: ["service-function-generate"],
                },
            },
        });
        expect(target.getOptions().getAddons("server")).toEqual(["service-function-generate"]);
        // Since websmith 0.8.0, getAvailableAddons() only returns explicitly requested addons
        expect(target.getAddonRegistry()!.getAvailableAddons().getNames()).toEqual(["service-function-generate"]);
    });

    it("should handle unknown arguments", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        const target = new NoReporter();
        jest.spyOn(target, "reportDiagnostic").mockImplementation(() => {});

        executeCompiler("--unknown --another-unknown expected", new Compiler({ reporter: target }, {}, createSystem()));

        expect(process.stderr.write).toHaveBeenNthCalledWith(1, expect.stringContaining("error: unknown option '--unknown'"));
        expect(process.stderr.write).toHaveBeenNthCalledWith(2, expect.stringContaining("Add --help for additional information."));
        expect(process.stderr.write).toHaveBeenCalledTimes(2);
    });

    it("should yield script file with single file and emit true", () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createSourceFile(
            `
            export const hello = "world";            
            export function greet(name: string): string {
                return \`Hello, \${name}!\`;
            }    
            `,
            "test.ts"
        );

        executeCompiler(
            `--project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`,
            new Compiler({ reporter: new NoReporter() }, {}, createSystem())
        );

        expect(getOutput("test.js")).toMatchInlineSnapshot(`
            "export const hello = "world";
            export function greet(name) {
                return \`Hello, \${name}!\`;
            }
            "
        `);
    });

    it("should yield script and declaration files with single file, declaration and emit true", () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            declaration: true,
            declarationMap: true,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createSourceFile(
            `
            // @annotated()
            export const getFoobar = (date: Date) => {
                return foobar(date);
            };

            const foobar = (date: Date) => {
                return "foobar " + date.toISOString();
            };

        `,
            "foobar-arrow.ts"
        );

        executeCompiler("--project ./tsconfig.json", new Compiler({ reporter: new NoReporter() }, {}, createSystem()));

        expect(getOutput("foobar-arrow.js")).toMatchInlineSnapshot(`
            "// @annotated()
            export const getFoobar = (date) => {
                return foobar(date);
            };
            const foobar = (date) => {
                return "foobar " + date.toISOString();
            };
            "
        `);
        expect(getOutput("foobar-arrow.d.ts")).toMatchInlineSnapshot(`
            "export declare const getFoobar: (date: Date) => string;
            //# sourceMappingURL=foobar-arrow.d.ts.map"
        `);
        expect(getOutput("foobar-arrow.d.ts.map")).toMatchInlineSnapshot(
            `"{"version":3,"file":"foobar-arrow.d.ts","sourceRoot":"","sources":["../src/foobar-arrow.ts"],"names":[],"mappings":"AAEY,eAAO,MAAM,SAAS,SAAU,IAAI,WAEnC,CAAC"}"`
        );
    });

    it("should yield client profile and tsconfig options with options client and project", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });

        executeCompiler(`--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`, target);

        expect(target.getOptions()).toEqual({
            buildDir: testDirs.PROJECT_DIR,
            cliArgs: {
                compileOnSave: false,
                errors: expect.any(Array), // cannot find included source files
                fileNames: [],
                options: {
                    allowJs: false,
                    checkJs: false,
                    configFilePath: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                    declaration: false,
                    declarationMap: false,
                    emitDecorationOnly: false,
                    esModuleInterop: false,
                    jsx: 1,
                    module: 99,
                    moduleResolution: 2,
                    noEmit: false,
                    outDir: testDirs.OUTPUT_DIR,
                    pretty: true,
                    project: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                    removeComments: false,
                    strict: false,
                    target: 99,
                    transpileOnly: true,
                },
                raw: {
                    compilerOptions: {
                        module: "esnext",
                        moduleResolution: "node10",
                        noEmit: false,
                        outDir: testDirs.OUTPUT_DIR,
                        target: "esnext",
                    },
                    configFilePath: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                    include: ["src/**/*"],
                    exclude: ["node_modules", "dist"],
                },
                typeAcquisition: {
                    enable: false,
                    include: [],
                    exclude: [],
                },
                wildcardDirectories: {
                    [testDirs.SOURCE_DIR]: 1,
                },
            },
            config: {
                addons: [],
                addonsDir: path.resolve(__dirname, "../../addons/lib"),
                transpileOnly: true,
                addonEmitOnly: true,
                profiles: {
                    client: {
                        addons: ["client-function-transform"],
                    },
                },
            },
            debug: false,
            profile: "client",
            reporter: expect.any(NoReporter),
            system: expect.any(Object),
            watch: false,
            tsConfig: {
                allowJs: false,
                checkJs: false,
                configFilePath: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                declaration: false,
                declarationMap: false,
                emitDecorationOnly: false,
                esModuleInterop: false,
                jsx: ts.JsxEmit.Preserve,
                outDir: testDirs.OUTPUT_DIR,
                noEmit: false,
                pretty: true,
                project: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
                removeComments: false,
                strict: false,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                transpileOnly: true,
            },
            tsConfigFile: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
        });
    });

    it("should yield client and server addons with default options", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

        executeCompiler("", target);

        // In websmith 0.8.0, without explicit addon or profile configuration, no addons are loaded
        const actual = target.getAddonRegistry()!.getAvailableAddons().getNames();
        expect(actual).toEqual([]);
    });

    it("should yield proxy-function with single file, client and emit", () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createSourceFile(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";
            
            // @service()
            export function getFoobar(date: Date, context?: Context, serialization?: Serialization) {
                return foobar(date);
            }

            function foobar(date: Date) {
                return "foobar " + date.toISOString();
            }
        `,
            "service-function.ts"
        );

        executeCompiler(`--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
"import { remoteInvoke } from "@quatico/magellan-client";
// @service()
export function getFoobar(date, context, serialization) {
    return remoteInvoke({ name: "getFoobar", data: date, namespace: "default" }, context, serialization);
}
"
`);
    });

    it("should call getContext using profile client with option client", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());
        // @ts-expect-error - protected method
        jest.spyOn(target, "getContext");

        executeCompiler(`--client`, target);

        // @ts-expect-error - protected method
        expect(target.getContext).toHaveBeenCalledWith("client");
    });

    it("should yield client tsconfig options with client options and configFile with client profile tsconfig", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());
        createTsConfigFile({ outDir: testDirs.OUTPUT_DIR, noEmit: false, target: 1, module: 3 });
        createWebsmithConfig({
            profiles: {
                client: {
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/client`,
                        target: ts.ScriptTarget.ESNext,
                        module: ts.ModuleKind.ESNext,
                        moduleResolution: ts.ModuleResolutionKind.Node10,
                    },
                },
            },
        });

        executeCompiler(
            `--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`,
            target
        );

        expect(target.getOptions().getOptions("client")).toMatchObject({
            configFile: path.resolve(testDirs.PROJECT_DIR, "websmith.config.json"),
            buildDir: testDirs.PROJECT_DIR,
            tsConfig: {
                outDir: `${testDirs.OUTPUT_DIR}/client`,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
            },
            tsConfigFile: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
        });
    });

    it("should yield client tsconfig context with client options and configFile with client profile tsconfig", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());
        createTsConfigFile({ outDir: testDirs.OUTPUT_DIR, noEmit: false, target: 1, module: 3 });
        createWebsmithConfig({
            profiles: {
                client: {
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/client`,
                        target: ts.ScriptTarget.ESNext,
                        module: ts.ModuleKind.ESNext,
                        moduleResolution: ts.ModuleResolutionKind.Node10,
                    },
                },
            },
        });

        executeCompiler(
            `--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`,
            target
        );

        // @ts-expect-error - protected method
        expect(target.getContext("client")?.getCliArgs().options).toMatchObject({
            configFilePath: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
            outDir: `${testDirs.OUTPUT_DIR}/client`,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
            project: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
        });
    });

    it("should yield proxy-function with single file, addon client-function-transform in profile and emit", () => {
        createTsConfigFile({ outDir: testDirs.OUTPUT_DIR, noEmit: false, target: 1, module: 3 });
        createWebsmithConfig({
            profiles: {
                client: {
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/client`,
                        target: ts.ScriptTarget.ESNext,
                        module: ts.ModuleKind.ESNext,
                        moduleResolution: ts.ModuleResolutionKind.Node10,
                    },
                },
            },
        });
        createSourceFile(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";
            
            // @service()
            export function getFoobar(date: Date, context?: Context, serialization?: Serialization) {
                return foobar(date);
            }

            function foobar(date: Date) {
                return "foobar " + date.toISOString();
            }
        `,
            "service-function.ts"
        );

        executeCompiler(
            `--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`
        );

        expect(getOutput("client/service-function.js")).toMatchInlineSnapshot(`
"import { remoteInvoke } from "@quatico/magellan-client";
// @service()
export function getFoobar(date, context, serialization) {
    return remoteInvoke({ name: "getFoobar", data: date, namespace: "default" }, context, serialization);
}
"
`);
    });

    it("should yield proxy-function and remote-function with single file, addons from profiles and emit", () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createSourceFile(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";
            
            // @service()
            export function getFoobar(date: Date, context?: Context, serialization?: Serialization) {
                return foobar(date);
            }

            function foobar(date: Date) {
                return "foobar " + date.toISOString();
            }
        `,
            "service-function.ts"
        );

        executeCompiler(`--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
"import { remoteInvoke } from "@quatico/magellan-client";
// @service()
export function getFoobar(date, context, serialization) {
    return remoteInvoke({ name: "getFoobar", data: date, namespace: "default" }, context, serialization);
}
"
`);

        executeCompiler(`--server --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
            "// @service()
            export function getFoobar(date, context, serialization) {
                return foobar(date);
            }
            function foobar(date) {
                return "foobar " + date.toISOString();
            }
            "
        `);
    });

    it("should allow --addonsDir CLI option", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

        // Mock resolveAddonsDir to return the input path for CLI testing
        mockModuleResolver.resolveAddonsDir.mockImplementation(dir => dir || path.resolve(__dirname, "../../addons/lib"));

        executeCompiler(`--addonsDir ${ADDONS_DIR}`, target);

        // Should not produce any error
        expect(process.stderr.write).not.toHaveBeenCalled();
        // Should use the specified addons directory
        expect(target.getOptions().config?.addonsDir).toBe(ADDONS_DIR);
        // Should have called resolveAddonsDir with the CLI argument
        expect(mockModuleResolver.resolveAddonsDir).toHaveBeenCalledWith(ADDONS_DIR);
    });

    it("should yield error when using option --addons", () => {
        const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--addons service-function-generate`);

        // Check what calls were actually made
        const allCalls = stderrSpy.mock.calls.map(call => call[0]);

        // Filter to only the calls that contain the expected error messages
        const errorCalls = allCalls.filter(
            call =>
                typeof call === "string" &&
                (call.includes("error: unknown option '--addons'") || call.includes("Add --help for additional information."))
        );

        expect(errorCalls.length).toBe(2);
        expect(errorCalls[0]).toContain("error: unknown option '--addons'");
        expect(errorCalls[1]).toContain("Add --help for additional information.");
    });

    it("should yield error when using option --profile", () => {
        const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--profile foobar`);

        // Check what calls were actually made
        const allCalls = stderrSpy.mock.calls.map(call => call[0]);

        // Filter to only the calls that contain the expected error messages
        const errorCalls = allCalls.filter(
            call =>
                typeof call === "string" &&
                (call.includes("error: unknown option '--profile'") || call.includes("Add --help for additional information."))
        );

        expect(errorCalls.length).toBe(2);
        expect(errorCalls[0]).toContain("error: unknown option '--profile'");
        expect(errorCalls[1]).toContain("Add --help for additional information.");
    });

    it("should allow custom addonsDir in configFile", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        createWebsmithConfig({
            addonsDir: ADDONS_DIR,
        });

        executeCompiler(`--configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`);

        // Should not produce any warning for addonsDir
        expect(process.stderr.write).not.toHaveBeenCalled();
    });

    it("should yield error when using option configFile with invalid addons property", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        createWebsmithConfig({
            addons: ["foobar"],
        });

        executeCompiler(`--configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`);

        expect(process.stderr.write).toHaveBeenCalledWith(
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json". Remove option "addons" from configuration file and use "--client" or "--server" parameters instead.\n`
        );
    });

    it("should yield error when using option configFile with invalid property addons in profile", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        createWebsmithConfig({
            profiles: {
                client: {
                    addons: ["foobar"],
                },
            },
        });

        executeCompiler(`--client --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`);

        expect(process.stderr.write).toHaveBeenCalledWith(
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json" for profile "client". Remove option "addons" from configuration file and use "--client" or "--server" parameters instead.\n`
        );
    });

    it("should yield error when using option configFile with valid profile configuration", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: 1,
            module: 3,
        });
        createWebsmithConfig({
            profiles: {
                client: {
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/client`,
                        target: ts.ScriptTarget.ESNext,
                        module: ts.ModuleKind.ESNext,
                        moduleResolution: ts.ModuleResolutionKind.Node10,
                    },
                },
            },
        });

        createSourceFile(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";
            
            // @service()
            export function getFoobar(date: Date, context?: Context, serialization?: Serialization) {
                return foobar(date);
            }

            function foobar(date: Date) {
                return "foobar " + date.toISOString();
            }
        `,
            "service-function.ts"
        );

        executeCompiler(
            `--client --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")} --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`,
            target
        );

        expect(target.getOptions().getAddons("client")).toEqual(["client-function-transform"]);
        // In websmith 0.8.0, getAvailableAddons() only returns explicitly requested addons
        expect(target.getAddonRegistry()!.getAvailableAddons().getNames()).toEqual(["client-function-transform"]);
        expect(getOutput("client/service-function.js")).toMatchInlineSnapshot(`
"import { remoteInvoke } from "@quatico/magellan-client";
// @service()
export function getFoobar(date, context, serialization) {
    return remoteInvoke({ name: "getFoobar", data: date, namespace: "default" }, context, serialization);
}
"
`);
    });

    it("should allow --addonsDir CLI option with config file addons warning", () => {
        const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createWebsmithConfig({
            addons: ["client-function-transform"],
        });

        executeCompiler(
            `--addonsDir ${ADDONS_DIR} --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`
        );

        // Check what calls were actually made
        const allCalls = stderrSpy.mock.calls.map(call => call[0]);

        // Filter to only the calls that contain the expected warning message
        const warningCalls = allCalls.filter(
            call =>
                typeof call === "string" &&
                call.includes(
                    `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json". Remove option "addons" from configuration file and use "--client" or "--server" parameters instead.`
                )
        );

        // Should only warn about the config file addons, not about --addonsDir CLI option
        expect(warningCalls.length).toBe(1);
        expect(warningCalls[0]).toContain(
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json". Remove option "addons" from configuration file and use "--client" or "--server" parameters instead.`
        );
    });

    it("should yield error with options --client and --server together", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--client --server`);

        expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("error: options --client and --server cannot be used together"));
    });

    it("should pass source files to compiler cliArgs", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

        // Test with source files
        executeCompiler("src/file1.ts src/file2.ts --client", target);

        // Verify that source files are included in cliArgs.fileNames
        const cliArgs = target.getOptions().cliArgs;
        expect(cliArgs).toBeDefined();
        expect(cliArgs.fileNames).toHaveLength(2);
        expect(cliArgs.fileNames[0]).toMatch(/src\/file1\.ts$/);
        expect(cliArgs.fileNames[1]).toMatch(/src\/file2\.ts$/);
    });

    describe("addonEmitOnly flag", () => {
        it("should pass addonEmitOnly flag to compiler config", () => {
            const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

            executeCompiler("--addonEmitOnly", target);

            expect(target.getOptions().config?.addonEmitOnly).toBe(true);
        });

        it("should emit only addon-processed files with --client --addonEmitOnly", () => {
            createTsConfigFile({
                outDir: testDirs.OUTPUT_DIR,
                noEmit: false,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                declaration: true,
            });

            // File WITH @service() decorator - should be emitted
            createSourceFile(
                `
                import { type Context, type Serialization } from "@quatico/magellan-shared";

                // @service()
                export function getUser(id: string, context?: Context, serialization?: Serialization) {
                    return { id, name: "Test User" };
                }
                `,
                "service-function.ts"
            );

            // File WITHOUT @service() decorator - should NOT be emitted with addonEmitOnly
            createSourceFile(
                `
                export function helperFunction(value: string) {
                    return value.toUpperCase();
                }
                `,
                "helper.ts"
            );

            // Another file WITHOUT @service() - should NOT be emitted
            createSourceFile(
                `
                export type UserType = {
                    id: string;
                    name: string;
                };
                `,
                "types.ts"
            );

            executeCompiler(`--client --addonEmitOnly --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

            // File with @service() should be emitted
            expect(getOutput("service-function.js")).toBeDefined();
            expect(getOutput("service-function.js")).toContain("remoteInvoke");

            // Files without @service() should NOT be emitted with addonEmitOnly
            expect(getOutput("helper.js")).toBeUndefined();
            expect(getOutput("types.js")).toBeUndefined();
        });

        it("should emit only addon-processed files with --server --addonEmitOnly", () => {
            createTsConfigFile({
                outDir: testDirs.OUTPUT_DIR,
                noEmit: false,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                declaration: true,
            });

            // File WITH @service() decorator - should be emitted
            createSourceFile(
                `
                import { type Context, type Serialization } from "@quatico/magellan-shared";

                // @service()
                export function createOrder(data: any, context?: Context, serialization?: Serialization) {
                    return { orderId: "123", ...data };
                }
                `,
                "order-service.ts"
            );

            // File WITHOUT @service() decorator - should NOT be emitted with addonEmitOnly
            createSourceFile(
                `
                export const CONFIG = {
                    apiUrl: "https://api.example.com",
                    timeout: 5000,
                };
                `,
                "config.ts"
            );

            // Another file WITHOUT @service() - should NOT be emitted
            createSourceFile(
                `
                export class Validator {
                    validate(input: any) {
                        return input != null;
                    }
                }
                `,
                "validator.ts"
            );

            executeCompiler(`--server --addonEmitOnly --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

            // File with @service() should be emitted
            expect(getOutput("order-service.js")).toBeDefined();
            expect(getOutput("order-service.js")).toContain("// @service()");

            // Files without @service() should NOT be emitted with addonEmitOnly
            expect(getOutput("config.js")).toBeUndefined();
            expect(getOutput("validator.js")).toBeUndefined();
        });

        // NOTE: This test is skipped due to a websmith 0.8.3 issue where auto-enabled flags
        // don't behave the same as explicitly passed flags. The unit tests confirm the flags
        // ARE being set correctly, but websmith doesn't emit files when the flags are set
        // programmatically vs. passed on the command line. This needs investigation in websmith.
        it.skip("should auto-enable addonEmitOnly and transpileOnly with --client", () => {
            createTsConfigFile({
                outDir: testDirs.OUTPUT_DIR,
                noEmit: false,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                declaration: true,
            });

            // File WITH @service() decorator
            createSourceFile(
                `
                import { type Context, type Serialization } from "@quatico/magellan-shared";

                // @service()
                export function getData(context?: Context, serialization?: Serialization) {
                    return { data: "test" };
                }
                `,
                "service.ts"
            );

            // File WITHOUT @service() decorator
            createSourceFile(
                `
                export function utility() {
                    return "utility";
                }
                `,
                "utility.ts"
            );

            executeCompiler(`--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

            // Only service file should be emitted (addonEmitOnly is auto-enabled with --client)
            expect(getOutput("service.js")).toBeDefined();
            expect(getOutput("service.js")).toContain("remoteInvoke");
            expect(getOutput("utility.js")).toBeUndefined();
        });

        it("should work with --client --addonEmitOnly --transpileOnly", () => {
            createTsConfigFile({
                outDir: testDirs.OUTPUT_DIR,
                noEmit: false,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                declaration: true,
            });

            // File WITH @service() decorator
            createSourceFile(
                `
                import { type Context, type Serialization } from "@quatico/magellan-shared";

                // @service()
                export function processData(input: any, context?: Context, serialization?: Serialization) {
                    return { processed: true, input };
                }
                `,
                "processor.ts"
            );

            // File WITHOUT @service() decorator
            createSourceFile(
                `
                export const constant = "value";
                `,
                "constants.ts"
            );

            executeCompiler(`--client --addonEmitOnly --transpileOnly --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

            // File with @service() should be emitted
            expect(getOutput("processor.js")).toBeDefined();
            expect(getOutput("processor.js")).toContain("remoteInvoke");

            // File without @service() should NOT be emitted
            expect(getOutput("constants.js")).toBeUndefined();
        });

        it("should work with --server --addonEmitOnly --transpileOnly", () => {
            createTsConfigFile({
                outDir: testDirs.OUTPUT_DIR,
                noEmit: false,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                declaration: true,
            });

            // File WITH @service() decorator
            createSourceFile(
                `
                import { type Context, type Serialization } from "@quatico/magellan-shared";

                // @service()
                export function executeTask(params: any, context?: Context, serialization?: Serialization) {
                    return { success: true, params };
                }
                `,
                "task-executor.ts"
            );

            // File WITHOUT @service() decorator
            createSourceFile(
                `
                export interface Task {
                    id: string;
                    status: string;
                }
                `,
                "task-types.ts"
            );

            executeCompiler(`--server --addonEmitOnly --transpileOnly --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

            // File with @service() should be emitted
            expect(getOutput("task-executor.js")).toBeDefined();
            expect(getOutput("task-executor.js")).toContain("// @service()");

            // File without @service() should NOT be emitted
            expect(getOutput("task-types.js")).toBeUndefined();
        });
    });
});

const executeCompiler = (args = "", compiler?: Compiler) => {
    process.chdir(testDirs.PROJECT_DIR);
    const argArray = args.split(/\s+/).filter(arg => arg.length > 0);

    // addCompileCommand returns the compile subcommand, so parse arguments directly on it
    // without prepending "compile" since we're already on the compile command
    addCompileCommand(new Command(), compiler).parse(argArray, { from: "user" });
};

const createTsConfig = (config: ts.CompilerOptions) => {
    // Convert enum values to strings for proper JSON serialization
    const normalizedConfig = {
        ...config,
        ...(config.target !== undefined && {
            target: ts.ScriptTarget[config.target] === "Latest" ? "esnext" : ts.ScriptTarget[config.target].toLowerCase(),
        }),
        ...(config.module !== undefined && { module: ts.ModuleKind[config.module].toLowerCase() }),
        ...(config.jsx !== undefined && { jsx: ts.JsxEmit[config.jsx].toLowerCase() }),
        ...(config.moduleResolution !== undefined && { moduleResolution: ts.ModuleResolutionKind[config.moduleResolution].toLowerCase() }),
    };

    const tsConfig = {
        compilerOptions: normalizedConfig,
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
    };
    return JSON.stringify(tsConfig, null, 2);
};

const createTsConfigFile = (config: ts.CompilerOptions) => {
    fs.writeFileSync(path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"), createTsConfig(config), { encoding: "utf-8" });
};

const createWebsmithConfig = (config: CompilationConfig) => {
    fs.writeFileSync(path.resolve(testDirs.PROJECT_DIR, "websmith.config.json"), JSON.stringify(config), { encoding: "utf-8" });
};

const createSourceFile = (fileContent: string, fileName: string) => {
    fs.writeFileSync(path.resolve(testDirs.SOURCE_DIR, fileName), fileContent, { encoding: "utf-8" });
};

const getOutput = (filePath: string): string | undefined =>
    fs.existsSync(path.join(testDirs.OUTPUT_DIR, filePath)) ? fs.readFileSync(path.join(testDirs.OUTPUT_DIR, filePath), "utf-8") : undefined;
