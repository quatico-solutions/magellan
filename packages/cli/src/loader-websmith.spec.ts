/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type CompilationConfig, type WebpackLoaderOptions } from "@quatico/websmith-api";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import webpack from "webpack";

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

describe("websmith-loader", () => {
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

    it("should parse process.argv with debug flags", async () => {
        createTsConfigFile({ outDir: testDirs.OUTPUT_DIR, noEmit: false });
        createSourceFile(
            `
            export const hello = "world";            
            export function greet(name: string): string {
                return \`Hello, \${name}!\`;
            }    
        `,
            "test.ts"
        );

        await executeWebpack({ tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json") });

        expect(getOutput("test.js")).toBeDefined();
        expect(getOutput("test.js")).toContain("hello");
        expect(getOutput("test.js")).toContain("greet");
    });

    it("should yield script and declaration files with single file, declaration and emit true", async () => {
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

        await executeWebpack({
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
        });

        expect(getOutput("foobar-arrow.js")).toMatchInlineSnapshot(`
"/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   y: () => (/* binding */ getFoobar)
/* harmony export */ });
// @annotated()
const getFoobar = (date) => {
    return foobar(date);
};
const foobar = (date) => {
    return "foobar " + date.toISOString();
};

const __webpack_exports__getFoobar = __webpack_exports__.y;
export { __webpack_exports__getFoobar as getFoobar };

//# sourceMappingURL=foobar-arrow.js.map"
`);
        expect(getOutput("foobar-arrow.d.ts")).toMatchInlineSnapshot(`
            "export declare const getFoobar: (date: Date) => string;
            //# sourceMappingURL=foobar-arrow.d.ts.map"
        `);
        expect(getOutput("foobar-arrow.d.ts.map")).toMatchInlineSnapshot(
            `"{"version":3,"file":"foobar-arrow.d.ts","sourceRoot":"","sources":["../src/foobar-arrow.ts"],"names":[],"mappings":"AAEY,eAAO,MAAM,SAAS,SAAU,IAAI,WAEnC,CAAC"}"`
        );
    });

    it("should yield script and no declaration files with single file, declaration false and emit true", async () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            declaration: false,
            declarationMap: false,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createSourceFile(
            `
            const foobar = (date: Date) => {
                return "foobar " + date.toISOString();
            };
        `,
            "foobar-arrow.ts"
        );

        await executeWebpack({
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
        });

        expect(getOutput("foobar-arrow.js")).toMatchInlineSnapshot(`
            "const foobar = (date) => {
                return "foobar " + date.toISOString();
            };


            //# sourceMappingURL=foobar-arrow.js.map"
        `);
        expect(getOutput("foobar-arrow.d.ts")).not.toBeDefined();
        expect(getOutput("foobar-arrow.d.ts.map")).not.toBeDefined();
    });

    it("should yield proxy-function with single file, addon client-function-transform in profile and emit", async () => {
        createTsConfigFile({ outDir: testDirs.OUTPUT_DIR, noEmit: false, target: 1, module: 3 });
        createWebsmithConfigFile({
            addonsDir: ADDONS_DIR,
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

        await executeWebpack({
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
            configFile: path.join(testDirs.PROJECT_DIR, "websmith.config.json"),
            config: {
                addonsDir: ADDONS_DIR,
            },
            profile: "target",
        });

        expect(getOutput("target/service-function.js")).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export function getFoobar(date, context, serialization) {
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
            }
            "
        `);
    });

    it("should yield proxy-function and remote-function with single file, addons from profiles and emit", async () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createWebsmithConfigFile({
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

        await executeWebpack({
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
            configFile: path.join(testDirs.PROJECT_DIR, "websmith.config.json"),
            profile: "client",
        });

        expect(getOutput("client/service-function.js")).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export function getFoobar(date, context, serialization) {
                return remoteInvoke({ name: "getFoobar", data: { date: date }, namespace: "default" }, context, serialization);
            }
            "
        `);

        await executeWebpack({
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
            tsConfig: {
                declaration: true,
            },
            configFile: path.join(testDirs.PROJECT_DIR, "websmith.config.json"),
            profile: "server",
        });

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

    it("should yield remote-function with single file, addon service-function-generate and emit", async () => {
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

        await executeWebpack({
            config: {
                addonsDir: ADDONS_DIR,
                addons: ["service-function-generate"],
            },
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
        });

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
            "/******/ // The require scope
            /******/ var __webpack_require__ = {};
            /******/ 
            /************************************************************************/
            /******/ /* webpack/runtime/define property getters */
            /******/ (() => {
            /******/ 	// define getter functions for harmony exports
            /******/ 	__webpack_require__.d = (exports, definition) => {
            /******/ 		for(var key in definition) {
            /******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            /******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
            /******/ 			}
            /******/ 		}
            /******/ 	};
            /******/ })();
            /******/ 
            /******/ /* webpack/runtime/hasOwnProperty shorthand */
            /******/ (() => {
            /******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
            /******/ })();
            /******/ 
            /************************************************************************/
            var __webpack_exports__ = {};
            /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */   y: () => (/* binding */ getFoobar)
            /* harmony export */ });
            // @service()
            function getFoobar(date, context, serialization) {
                return foobar(date);
            }
            function foobar(date) {
                return "foobar " + date.toISOString();
            }

            const __webpack_exports__getFoobar = __webpack_exports__.y;
            export { __webpack_exports__getFoobar as getFoobar };

            //# sourceMappingURL=service-function.js.map"
        `);
    });

    it("should yield proxy-function with single file, addons-config client-function-transform and emit", async () => {
        createTsConfigFile({
            outDir: testDirs.OUTPUT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });
        createWebsmithConfigFile({
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

        await executeWebpack({
            configFile: path.join(testDirs.PROJECT_DIR, "websmith.config.json"),
            config: {
                addonsDir: ADDONS_DIR,
            },
            tsConfigFile: path.join(testDirs.PROJECT_DIR, "tsconfig.json"),
        });

        expect(getOutput("service-function.js")).toMatchInlineSnapshot(`
            "/******/ // The require scope
            /******/ var __webpack_require__ = {};
            /******/ 
            /************************************************************************/
            /******/ /* webpack/runtime/define property getters */
            /******/ (() => {
            /******/ 	// define getter functions for harmony exports
            /******/ 	__webpack_require__.d = (exports, definition) => {
            /******/ 		for(var key in definition) {
            /******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            /******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
            /******/ 			}
            /******/ 		}
            /******/ 	};
            /******/ })();
            /******/ 
            /******/ /* webpack/runtime/hasOwnProperty shorthand */
            /******/ (() => {
            /******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
            /******/ })();
            /******/ 
            /************************************************************************/
            var __webpack_exports__ = {};
            /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */   y: () => (/* binding */ getFoobar)
            /* harmony export */ });
            // @service()
            function getFoobar(date, context, serialization) {
                return foobar(date);
            }
            function foobar(date) {
                return "foobar " + date.toISOString();
            }

            const __webpack_exports__getFoobar = __webpack_exports__.y;
            export { __webpack_exports__getFoobar as getFoobar };

            //# sourceMappingURL=service-function.js.map"
        `);
    });
});

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

const createWebsmithConfigFile = (config: CompilationConfig) => {
    fs.writeFileSync(path.resolve(testDirs.PROJECT_DIR, "websmith.config.json"), JSON.stringify(config), { encoding: "utf-8" });
};

const createSourceFile = (fileContent: string, fileName: string) => {
    fs.writeFileSync(path.resolve(testDirs.SOURCE_DIR, fileName), fileContent, { encoding: "utf-8" });
};

const getOutput = (filePath: string): string | undefined =>
    fs.existsSync(path.join(testDirs.OUTPUT_DIR, filePath)) ? fs.readFileSync(path.join(testDirs.OUTPUT_DIR, filePath), "utf-8") : undefined;

const executeWebpack = async (options: WebpackLoaderOptions = {}): Promise<void> => {
    // DO NOT change working directory - this causes the "uv_cwd" error when directory gets deleted

    // Find the first TypeScript file in the source directory as entry
    const sourceFiles = fs.readdirSync(testDirs.SOURCE_DIR).filter(file => file.endsWith(".ts"));
    if (sourceFiles.length === 0) {
        throw new Error("No TypeScript files found in source directory");
    }

    const entryFile = sourceFiles[0];
    const webpackConfig = createWebpackConfig(options, entryFile);

    // Webpack configuration is ready

    return new Promise((resolve, reject) => {
        webpack(webpackConfig, (err, stats) => {
            if (err) {
                console.error("Webpack compilation error:", err);
                reject(err);
                return;
            }

            if (stats?.hasErrors()) {
                const errors = stats.toJson().errors;
                console.error("Webpack compilation errors:", JSON.stringify(errors, null, 2));
                reject(new Error("Webpack compilation failed"));
                return;
            }

            if (stats?.hasWarnings()) {
                console.warn("Webpack compilation warnings:", stats.toJson().warnings);
            }

            resolve();
        });
    });
};

const createWebpackConfig = (options: WebpackLoaderOptions, entryFile: string): webpack.Configuration => {
    // Get the base name without extension for output filename
    const outputName = path.basename(entryFile, path.extname(entryFile));

    return {
        entry: `${testDirs.SOURCE_DIR}/${entryFile}`, // Use relative path from context
        output: {
            path: testDirs.OUTPUT_DIR,
            filename: `${outputName}.js`,
            library: {
                type: "module",
            },
        },
        experiments: {
            outputModule: true,
        },
        optimization: {
            minimize: false, // Don't minify to keep readable output
            concatenateModules: false, // Prevent module concatenation
        },
        devtool: "source-map",
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: require.resolve("websmith-loader"),
                            options: {
                                ...options,
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
            ],
        },
        stats: "minimal",
    };
};
