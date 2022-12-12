/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */
import { WarnMessage } from "@quatico/websmith-api";
import { createOptions } from "@quatico/websmith-cli";
import { Compiler, CompilerOptions, NoReporter } from "@quatico/websmith-compiler";
import { Command } from "commander";
import { writeFileSync } from "fs";
import { resolve } from "path";
import ts from "typescript";
import { getVersion } from "../extract-version";
import { addCompileCommand } from "./command";

class CompilerTestClass extends Compiler {
    public testOptions?: CompilerOptions;

    constructor(options: CompilerOptions, system?: ts.System) {
        super(options, system);
    }

    public setOptions(options: CompilerOptions): this {
        super.setOptions(options);
        this.testOptions = options;
        return this;
    }

    public compile(): any {
        console.info("Compiler.compile()");
    }

    public watch(): any {
        console.info("Compiler.watch()");
    }
}

describe("addCompileCommand", () => {
    let system: ts.System;

    beforeEach(() => {
        system = ts.sys;
        system.createDirectory("./addons");
        system.createDirectory("./expected");

        console.warn = jest.fn();
    });

    it("should set the default options w/ valid functionScriptPath", () => {
        createDefaultCompilerConfig();
        const target = new CompilerTestClass(createOptions({}, new NoReporter()), system);

        addCompileCommand(new Command(), target).parse(["compile"], { from: "user" });

        // expect(target.testOptions!.functionsDir).toBe("./functions");
        expect(target.testOptions!.project).toEqual({
            allowJs: false,
            allowSyntheticDefaultImports: true,
            alwaysStrict: true,
            configFilePath: expect.stringContaining("/tsconfig.json"),
            declaration: true,
            declarationMap: true,
            downlevelIteration: true,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
            experimentalDecorators: true,
            importHelpers: true,
            incremental: true,
            inlineSources: undefined,
            lib: ["lib.es2015.d.ts", "lib.es2016.d.ts", "lib.es2017.d.ts", "lib.esnext.d.ts", "lib.dom.d.ts"],
            module: 1,
            moduleResolution: 2,
            noEmit: false,
            noEmitOnError: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noImplicitThis: true,
            noUnusedLocals: true,
            outDir: resolve("./lib"),
            pretty: true,
            removeComments: false,
            resolveJsonModule: true,
            sourceMap: false,
            strict: true,
            strictBindCallApply: true,
            strictFunctionTypes: true,
            strictNullChecks: true,
            strictPropertyInitialization: true,
            target: 2,
            types: ["node", "jest"],
        });
        expect(target.getOptions().additionalArguments?.get("hostname")).toBe("http://localhost");
        expect(target.getOptions().additionalArguments?.get("port")).toBe(3000);
        // expect(target.testOptions!.serverModuleDir).toBe("./server-esm");
        expect(target.testOptions!.debug).toBe(false);
        expect(target.testOptions!.watch).toBe(false);
        // expect(target.testOptions!.addonsDir).toBe(resolve("./addons"));
        expect(target.testOptions!.config).toEqual({
            configFilePath: expect.stringContaining("/websmith.config.json"),
            targets: {
                client: {
                    addons: ["client-function-transform"],
                    config: {
                        debug: true,
                        functionsDir: "./functions",
                    },
                    options: {
                        outDir: resolve("./lib/client"),
                    },
                    writeFile: true,
                },
                server: {
                    addons: ["service-function-generate"],
                    config: {
                        debug: true,
                        functionsDir: "./functions",
                    },
                    options: {
                        outDir: resolve("./lib/server"),
                    },
                    writeFile: true,
                },
                expected: {
                    writeFile: true,
                },
            },
        });
        expect(target.testOptions!.targets).toEqual(["client", "server"]);
    });

    it("should output the cli version", () => {
        const target = jest.fn();
        console.info = target;

        addCompileCommand(new Command(), new CompilerTestClass(createOptions({}), system)).parse(["compile"], {
            from: "user",
        });

        expect(target).toHaveBeenCalledWith(`Magellan version ${getVersion()}`);
    });

    it("should set project option  w/ --project cli argument", () => {
        writeFileSync("expected/tsconfig.json", "{}");
        const target = new CompilerTestClass(createOptions({}), system);

        addCompileCommand(new Command(), target).parse(["compile", "--project", "expected/tsconfig.json"], { from: "user" });

        expect(target.testOptions!.project).toEqual({
            configFilePath: resolve("./expected/tsconfig.json"),
            inlineSources: undefined,
            outDir: "./lib",
            sourceMap: false,
        });
    });

    it("should set debug compiler option  w/ --debug cli argument", () => {
        createDefaultCompilerConfig();
        const target = new CompilerTestClass(createOptions({}), system);

        addCompileCommand(new Command(), target).parse(["compile", "--debug"], { from: "user" });

        expect(target.testOptions!.debug).toBe(true);
    });

    it("should set the hostname w/ --hostname cli argument", () => {
        const target = new CompilerTestClass(createOptions({}));

        addCompileCommand(new Command(), target).parse(["compile", "--hostname", "http://expected"], { from: "user" });

        expect(target.getOptions().additionalArguments).toEqual(
            new Map<string, unknown>([
                ["hostname", "http://expected"],
                ["port", 3000],
            ])
        );
    });

    it("should set the port w/ --port cli argument", () => {
        const target = new CompilerTestClass(createOptions({}));

        addCompileCommand(new Command(), target).parse(["compile", "--port", "5678"], { from: "user" });

        expect(target.getOptions().additionalArguments).toEqual(
            new Map<string, unknown>([
                ["port", 5678],
                ["hostname", "http://localhost"],
            ])
        );
    });

    it("should set the target w/ --targets cli argument", () => {
        createDefaultCompilerConfig();
        const target = new CompilerTestClass(createOptions({}), system);

        addCompileCommand(new Command(), target).parse(["compile", "--targets", "expected"], { from: "user" });

        expect(target.testOptions!.targets).toEqual(["expected", "client", "server"]);
    });

    it("should show warning w/ --addonsDir cli argument and non-existing path", () => {
        system.writeFile("./websmith.config.json", JSON.stringify({ targets: { client: {}, server: {} } }));
        const target = new Compiler(createOptions({}, new NoReporter()));
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["compile", "--addonsDir", "./unknown"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(
            new WarnMessage(`Addons directory "${system.resolvePath("./unknown")}" does not exist.`)
        );
    });

    it("should set the config option w/ --config cli argument and compiler configuration file found", () => {
        const fs = jest.requireActual("fs");
        fs.mkdirSync(resolve("./addons"), { recursive: true });
        fs.mkdirSync(resolve("./expected"), { recursive: true });
        fs.writeFileSync(resolve("./expected/expected.json"), "{}");
        const expected = resolve("./expected/expected.json");
        const target = new CompilerTestClass(createOptions({}), system);

        addCompileCommand(new Command(), target).parse(["compile", "--config", "./expected/expected.json"], { from: "user" });

        expect(target.testOptions!.config).toEqual(expect.objectContaining({ configFilePath: expected }));
        fs.rmSync(resolve("./addons"), { recursive: true, force: true });
        fs.rmSync(resolve("./expected"), { recursive: true, force: true });
    });

    it("should have undefined config path w/ --config cli argument and no compiler configuration file found", () => {
        const target = new CompilerTestClass(createOptions({}), system);
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["compile", "--config", "./expected/unexpected.json"], { from: "user" });

        expect(target.testOptions!.config).toBeUndefined();
        expect(target.getReporter().reportDiagnostic).toHaveBeenNthCalledWith(
            1,
            new WarnMessage(`No configuration file found at ${resolve("./expected/unexpected.json")}.`)
        );
    });

    it("should execute compile w/ --watch cli argument", () => {
        createDefaultCompilerConfig();
        const target = new CompilerTestClass(createOptions({}), system);
        target.watch = jest.fn();

        addCompileCommand(new Command(), target).parse(["compile", "--watch"], { from: "user" });

        expect(target.testOptions!.watch).toBe(true);
        expect(target.watch).toHaveBeenCalled();
    });

    it("should inform CLI user about tsconfig usage for unsupported command line arguments", () => {
        console.error = line => {
            throw new Error(line.toString());
        };
        const target = new CompilerTestClass(createOptions({}), system);

        expect(() => addCompileCommand(new Command(), target).parse(["compile", "--debug", "--allowJs", "--strict"], { from: "user" })).toThrow(
            `Unknown Argument "allowJs".` + `\nIf this is a tsc command, please configure it in your typescript configuration file.\n`
        );
    });
});

const createDefaultCompilerConfig = () => {
    writeFileSync(
        "./websmith.config.json",
        JSON.stringify({
            targets: {
                client: {
                    writeFile: true,
                    addons: ["client-function-transform"],
                    config: { functionsDir: "./functions", debug: true },
                    options: { outDir: "./lib/client" },
                },
                server: {
                    writeFile: true,
                    addons: ["service-function-generate"],
                    config: { functionsDir: "./functions", debug: true },
                    options: { outDir: "./lib/server" },
                },
                expected: {
                    writeFile: true,
                },
            },
        })
    );
};
