/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type CompilationConfig, Compiler, createSystem, NoReporter } from "@quatico/websmith-core";
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
        expect(target.getOptions()).toMatchObject({ tsConfig: { listFiles: true, debug: true, watch: true } });
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
                    removeComments: false,
                    strict: false,
                    target: 1,
                },
            },
            config: {
                addons: ["service-function-generate"],
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
                pretty: true,
                removeComments: false,
                strict: false,
                target: ts.ScriptTarget.ES5,
            },
            tsConfigFile: "/tsconfig.json",
            watch: false,
        });
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
            `"{"version":3,"file":"foobar-arrow.d.ts","sourceRoot":"","sources":["../src/foobar-arrow.ts"],"names":[],"mappings":"AACA,eAAO,MAAM,SAAS,SAAU,IAAI,WAEnC,CAAC"}"`
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
                },
                raw: {
                    compilerOptions: {
                        module: "esnext",
                        moduleResolution: "node10",
                        noEmit: false,
                        outDir: testDirs.OUTPUT_DIR,
                        target: "esnext",
                    },
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
                addons: ["client-function-transform"],
                addonsDir: path.resolve(__dirname, "../../addons/lib"),
                profiles: {
                    client: undefined,
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
            },
            tsConfigFile: path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"),
        });
    });

    it("should yield client and server addons with default options", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem());

        executeCompiler("", target);

        const actual = target.getAddonRegistry()!.getAvailableAddons().getNames();
        expect(actual).toEqual(["client-function-transform", "service-function-generate"]);
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
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
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
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
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
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
            }
            "
        `);

        executeCompiler(`--server --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
            "// @service()
            export function getFoobar({ date }, context, serialization) {
                return foobar(date);
            }
            function foobar(date) {
                return "foobar " + date.toISOString();
            }
            "
        `);
    });

    it("should yield error when using option --addonsDir", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--addonsDir ${ADDONS_DIR}`);

        expect(process.stderr.write).toHaveBeenNthCalledWith(1, expect.stringContaining("error: unknown option '--addonsDir'"));
        expect(process.stderr.write).toHaveBeenNthCalledWith(2, expect.stringContaining("Add --help for additional information."));
        expect(process.stderr.write).toHaveBeenCalledTimes(2);
    });

    it("should yield error when using option --addons", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--addons service-function-generate`);

        expect(process.stderr.write).toHaveBeenNthCalledWith(1, expect.stringContaining("error: unknown option '--addons'"));
        expect(process.stderr.write).toHaveBeenNthCalledWith(2, expect.stringContaining("Add --help for additional information."));
        expect(process.stderr.write).toHaveBeenCalledTimes(2);
    });

    it("should yield error when using option --profile", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--profile foobar`);

        expect(process.stderr.write).toHaveBeenNthCalledWith(1, expect.stringContaining("error: unknown option '--profile'"));
        expect(process.stderr.write).toHaveBeenNthCalledWith(2, expect.stringContaining("Add --help for additional information."));
        expect(process.stderr.write).toHaveBeenCalledTimes(2);
    });

    it("should yield error when using option configFile with invalid property addonsDir", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        createWebsmithConfig({
            addonsDir: ADDONS_DIR,
        });

        executeCompiler(`--configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`);

        expect(process.stderr.write).toHaveBeenCalledWith(
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json". Remove options "addons" and "addonsDir" from configuration file and use "--client" or "--server" parameters instead.\n`
        );
    });

    it("should yield error when using option configFile with invalid addons property", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
        createWebsmithConfig({
            addons: ["foobar"],
        });

        executeCompiler(`--configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`);

        expect(process.stderr.write).toHaveBeenCalledWith(
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json". Remove options "addons" and "addonsDir" from configuration file and use "--client" or "--server" parameters instead.\n`
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
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json" for profile "client". Remove options "addons" and "addonsDir" from configuration file and use "--client" or "--server" parameters instead.\n`
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

        expect(getOutput("client/service-function.js")).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export function getFoobar(date, context, serialization) {
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
            }
            "
        `);
    });

    it("should yield proxy-function with single file, addons-config client-function-transform and emit", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);
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

        expect(process.stderr.write).toHaveBeenNthCalledWith(1, `error: unknown option '--addonsDir'\n`);
        expect(process.stderr.write).toHaveBeenNthCalledWith(2, `Add --help for additional information.\n`);
        expect(process.stderr.write).toHaveBeenNthCalledWith(
            3,
            `Custom addon configuration found in "${testDirs.PROJECT_DIR}/websmith.config.json". Remove options "addons" and "addonsDir" from configuration file and use "--client" or "--server" parameters instead.\n`
        );
        expect(process.stderr.write).toHaveBeenCalledTimes(3);
    });

    it("should yield error with options --client and --server together", () => {
        jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        executeCompiler(`--client --server`);

        expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("error: options --client and --server cannot be used together"));
    });
});

const executeCompiler = (args = "", compiler?: Compiler) => {
    process.chdir(testDirs.PROJECT_DIR);
    addCompileCommand(new Command(), compiler).parse(
        args
            .split(" ")
            .map(it => it.trim())
            .filter(it => it !== ""),
        { from: "user" }
    );
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
