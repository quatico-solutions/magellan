/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type CompilationConfig, Compiler, createSystem, NoReporter } from "@quatico/websmith-core";
import { addCompileCommand } from "@quatico/websmith-compiler";
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

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
let testDirs: { PROJECT_DIR: string; OUTPUT_DIR: string; SOURCE_DIR: string };

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

        // Create mock type declarations for @quatico/magellan-shared to prevent compilation errors
        const sharedModuleDir = path.join(testDirs.PROJECT_DIR, "node_modules", "@quatico", "magellan-shared");

        fs.mkdirSync(sharedModuleDir, { recursive: true });
        fs.writeFileSync(
            path.join(sharedModuleDir, "index.d.ts"),
            `
            export interface Context {
                [key: string]: unknown;
            }

            export interface Serialization {
                [key: string]: unknown;
            }
            `.trim(),
            { encoding: "utf-8" }
        );
        fs.writeFileSync(
            path.join(sharedModuleDir, "package.json"),
            JSON.stringify({
                name: "@quatico/magellan-shared",
                version: "0.0.0-mock",
                types: "index.d.ts",
            }),
            { encoding: "utf-8" }
        );

        // Create mock type declarations for @quatico/magellan-client to prevent compilation errors
        const clientModuleDir = path.join(testDirs.PROJECT_DIR, "node_modules", "@quatico", "magellan-client");
        fs.mkdirSync(clientModuleDir, { recursive: true });
        fs.writeFileSync(
            path.join(clientModuleDir, "index.d.ts"),
            `
            export interface RemoteInvokeOptions {
                name: string;
                data: any;
                namespace: string;
            }

            export declare function remoteInvoke(options: RemoteInvokeOptions, context?: any, serialization?: any): any;
            `.trim(),
            { encoding: "utf-8" }
        );
        fs.writeFileSync(
            path.join(clientModuleDir, "package.json"),
            JSON.stringify({
                name: "@quatico/magellan-client",
                version: "0.0.0-mock",
                types: "index.d.ts",
            }),
            { encoding: "utf-8" }
        );
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        originalCwd && process.chdir(originalCwd);
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
        expect(target).toHaveBeenCalledWith(expect.stringContaining("Usage: websmith [options]"));
    });

    it("should parse process.argv with debug and watch flags", () => {
        jest.spyOn(process.stdout, "write").mockImplementation(() => true);
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem({}, { virtual: true }));
        const watchSpy = jest.spyOn(target, "watch").mockImplementation(() => target);

        executeCompiler("--debug --watch", target);

        // Verify that watch method was called (for --watch flag)
        expect(watchSpy).toHaveBeenCalled();
        expect(target.getOptions()).toMatchObject({ tsConfig: { listFiles: true } });
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

    it("should handle addon-related arguments", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem({}, { virtual: true }));
        executeCompiler("--addons foo,bar --addonsDir ./custom-addons", target);

        expect(target.getOptions().tsConfig).toEqual({
            // tsconfig does not contain extraArgs
            allowJs: false,
            checkJs: false,
            configFilePath: "/tsconfig.json",
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
        });
        expect(target.getOptions().config).toEqual({ addons: ["foo", "bar"], addonsDir: "/custom-addons" });
    });

    it("should handle empty arguments", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem({}, { virtual: true }));
        executeCompiler("", target);

        expect(target.getOptions()).toEqual({
            additionalArguments: expect.any(Map),
            buildDir: "/",
            cliArgs: {
                errors: [],
                fileNames: [],
                options: {
                    allowJs: false,
                    checkJs: false,
                    configFilePath: "/tsconfig.json",
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
            },
            config: {},
            debug: false,
            profile: undefined,
            reporter: expect.any(NoReporter),
            system: expect.any(Object),
            tsConfig: {
                allowJs: false,
                checkJs: false,
                configFilePath: "/tsconfig.json",
                declaration: false,
                declarationMap: false,
                emitDecorationOnly: false,
                esModuleInterop: false,
                jsx: ts.JsxEmit.Preserve,
                noEmit: false,
                pretty: true,
                project: "./tsconfig.json",
                removeComments: false,
                strict: false,
                target: ts.ScriptTarget.ES5,
            },
            tsConfigFile: expect.any(String),
            watch: false,
        });
    });

    it("should handle unknown arguments", () => {
        const target = new Compiler({ reporter: new NoReporter() }, {}, createSystem({}, { virtual: true }));
        executeCompiler("--unknown --another-unknown expected", target);

        expect(target.getOptions()).toMatchObject({
            additionalArguments: new Map<string, unknown>([
                ["unknown", true],
                ["another-unknown", "expected"],
            ]),
        });
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

        expect(getOutput("test.js")).toBeDefined();
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

    it("should yield proxy-function with single file, addon client-function-transform in profile and emit", () => {
        createTsConfigFile({ outDir: testDirs.OUTPUT_DIR, noEmit: false, target: 1, module: 3 });
        createWebsmithConfig({
            profiles: {
                target: {
                    addons: ["client-function-transform"],
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/target`,
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
            `--addonsDir ${ADDONS_DIR} --profile target --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`
        );

        expect(getOutput("target/service-function.js")).toMatchInlineSnapshot(`
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
        createWebsmithConfig({
            addonsDir: ADDONS_DIR,
            profiles: {
                client: {
                    addons: ["client-function-transform"],
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/client`,
                    },
                },
                server: {
                    addons: ["service-function-generate"],
                    tsConfig: {
                        outDir: `${testDirs.OUTPUT_DIR}/server`,
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
            `--profile client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`
        );

        expect(getOutput("client/service-function.js")).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export function getFoobar(date, context, serialization) {
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
            }
            "
        `);

        executeCompiler(
            `--profile server --declaration --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`
        );

        expect(getOutput("server/service-function.d.ts")).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            export declare function getFoobar({ date }: {
                date: Date;
            }, context?: Context, serialization?: Serialization): string;
            "
        `);

        expect(getOutput("server/service-function.js")).toMatchInlineSnapshot(`
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

    it("should yield remote-function with single file, addon service-function-generate in cli and emit", () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
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

        executeCompiler(`--addonsDir ${ADDONS_DIR} --addons service-function-generate --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

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

    it("should yield proxy-function with single file, addons-config client-function-transform and emit", () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createWebsmithConfig({
            addons: ["client-function-transform"],
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
            `--addonsDir ${ADDONS_DIR} --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")} --configFile ${path.join(testDirs.PROJECT_DIR, "websmith.config.json")}`
        );

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export function getFoobar(date, context, serialization) {
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
            }
            "
        `);
    });
});

const executeCompiler = (args = "", compiler?: Compiler) => {
    // Store original process.exit to restore later
    const originalExit = process.exit;
    let exitCode = 0;

    process.chdir(testDirs.PROJECT_DIR);

    try {
        // Mock process.exit to capture exit codes without actually exiting
        process.exit = (code = 0) => {
            exitCode = code;
            throw new Error(`Process exit called with code ${code}`);
        };

        addCompileCommand(new Command(), compiler).parse(args.split(" "), { from: "user" });
    } catch (err) {
        // Check if this was a successful exit (help shown, etc.)
        if (exitCode === 0 || process.exitCode === 0) {
            // Don't throw for successful operations
            return;
        }

        // Only throw for actual compilation failures
        if (!err.message?.includes("Process exit called")) {
            throw err;
        }

        // For non-zero exit codes, throw the error
        if (exitCode !== 0) {
            throw err;
        }
    } finally {
        // Always restore the original process.exit
        process.exit = originalExit;
    }
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
