/* eslint-disable curly */
import { type CompilationConfig, type CompilationProfile, type CompilerArguments } from "@quatico/websmith-api";
import { AddonRegistry, Compiler, createOptions, DefaultReporter } from "@quatico/websmith-core";
import { Command } from "commander";
import ts from "typescript";
import { ModuleResolver } from "./module-resolver";

interface CompilerOptions {
    configFile?: string;
    client?: boolean;
    server?: boolean;
    debug?: boolean;
    project?: string;
    transpileOnly?: boolean;
    addonEmitOnly?: boolean;
    watch?: boolean;
    init?: boolean;
    showConfig?: boolean;
    build?: boolean;
    pretty?: boolean;
    declaration?: boolean;
    declarationMap?: boolean;
    emitDeclarationOnly?: boolean;
    sourceMap?: boolean;
    noEmit?: boolean;
    target?: string;
    module?: string;
    lib?: string[];
    allowJs?: boolean;
    checkJs?: boolean;
    jsx?: string;
    outFile?: string;
    outDir?: string;
    removeComments?: boolean;
    strict?: boolean;
    types?: string[];
    esModuleInterop?: boolean;
    addonsDir?: string;
}

export const addCompileCommand = (parent = new Command(), compiler?: Compiler): Command => {
    return parent
        .name("magellan")
        .command("compile")
        .description("Compile TypeScript functions annotated with @service() for client and server use with Magellan")
        .showSuggestionAfterError()
        .showHelpAfterError("Add --help for additional information.")
        .argument("[source...]", "Source directory or files to compile (optional)")
        .option("-c, --configFile <filePath>", 'File path to the "./websmith.config.json" file.')
        .option("--client", "Generate client-side proxies for service functions. Automatically enables --addonEmitOnly and --transpileOnly.")
        .option(
            "--server",
            "Generate server-side remote functions to be called from the client. Automatically enables --addonEmitOnly and --transpileOnly."
        )
        .option("--debug", "Enable the output of debug information.")
        .option("-p, --project <projectPath>", "Compile the project given the path to its configuration file, or to a folder with a 'tsconfig.json'.")
        .option("-o, --transpileOnly", "Skip type checking for faster compilation. Auto-enabled with --client or --server.")
        .option("--addonEmitOnly", "Only emit transformed files (excludes helpers, types, config). Auto-enabled with --client or --server.")
        .option("-w, --watch", "Enable watch mode.")
        .option("--init", "Initializes a TypeScript project and creates a tsconfig.json file.")
        .option("--showConfig", "Print the final configuration instead of building.")
        .option("-b, --build", "Build one or more projects and their dependencies, if out of date.")
        .option("--pretty", "Enable color and formatting in TypeScript's output to make compiler errors easier to read.")
        .option("-d, --declaration", "Generate .d.ts files from TypeScript and JavaScript files in your project.")
        .option("--declarationMap", "Create sourcemaps for d.ts files.")
        .option("--emitDeclarationOnly", "Only output d.ts files and not JavaScript files.")
        .option("--sourceMap", "Create source map files for emitted JavaScript files.")
        .option("--noEmit", "Disable emitting files from a compilation.")
        .option(
            "-t, --target <target>",
            "Set the JavaScript language version for emitted JavaScript and include compatible library declarations.\n" +
                "one of:  es5, es5, es6/es2015, es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext"
        )
        .option("-m, --module <module>", "Specify what module code is generated.\n" + "one of:  commonjs, amd, umd, system, esnext, none")
        .option(
            "--lib <lib...>",
            "Specify a set of bundled library declaration files that describe the target runtime environment.\n" +
                "one or more:  es5, es6/es2015, es7/es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext, dom, dom.iterable, dom.asynciterable, webworker, webworker.importscripts, webworker.iterable, webworker.asynciterable, scripthost, es2015.core, es2015.collection, es2015.generator, es2015.iterable, es2015.promise, es2015.proxy, es2015.reflect, es2015.symbol, es2015.symbol.wellknown, es2016.array.include, es2016.intl, es2017.arraybuffer, es2017.date, es2017.object, es2017.sharedmemory, es2017.string, es2017.intl, es2017.typedarrays, es2018.asyncgenerator, es2018.asynciterable/esnext.asynciterable, es2018.intl, es2018.promise, es2018.regexp, es2019.array, es2019.object, es2019.string, es2019.symbol/esnext.symbol, es2019.intl, es2020.bigint/esnext.bigint, es2020.date, es2020.promise, es2020.sharedmemory, es2020.string, es2020.symbol.wellknown, es2020.intl, es2020.number, es2021.promise, es2021.string, es2021.weakref/esnext.weakref, es2021.intl, es2022.array, es2022.error, es2022.intl, es2022.object, es2022.string, es2022.regexp, es2023.array, es2023.collection, es2023.intl, es2024.arraybuffer, es2024.collection, es2024.object/esnext.object, es2024.promise/esnext.promise, es2024.regexp/esnext.regexp, es2024.sharedmemory, es2024.string/esnext.string, esnext.array, esnext.collection, esnext.intl, esnext.disposable, esnext.decorators, esnext.iterator, decorators, decorators.legacy"
        )
        .option("--allowJs", "Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files.")
        .option("--checkJs", "Enable error reporting in type-checked JavaScript files.")
        .option("--jsx <jsx>", "Specify what JSX code is generated.\n" + "one of:  preserve, react, react-jsx, react-jsxdev, react-jsx, react-jsxdev")
        .option(
            "--outFile <outFile>",
            "Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output."
        )
        .option("--outDir <outDir>", "Specify an output folder for all emitted files.")
        .option("--removeComments", "Disable emitting comments.")
        .option("--strict", "Enable all strict type-checking options.")
        .option("--types <types...>", "Specify type package names to be included without being referenced in a source file.")
        .option(
            "--esModuleInterop",
            "Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility."
        )
        .option("--addonsDir <addonsDir>", "Specify the directory containing custom addons.")
        .action((source: string[] | undefined, options: CompilerOptions) => {
            try {
                const system = ts.sys;
                const reporter = new DefaultReporter(system);
                const tsConfigFile = options.project ?? "./tsconfig.json";

                // Auto-enable optimizations when using --client or --server
                // This provides the optimal development workflow: fast builds + only emit transformed files
                if (options.client || options.server) {
                    if (options.transpileOnly === undefined) {
                        options.transpileOnly = true;
                    }
                    if (options.addonEmitOnly === undefined) {
                        options.addonEmitOnly = true;
                    }
                }

                const { client, server, ...rest } = options;

                // Validate that client and server options are not used together
                if (client && server) {
                    process.stderr.write("error: options --client and --server cannot be used together\n");
                    process.exit(1);
                }

                // Create the base options using websmith's createOptions
                // Remove configFile to prevent websmith-core from loading it again
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { configFile: _configFile, ...restWithoutConfigFile } = rest;
                const websmithOptions = createOptions(restWithoutConfigFile as CompilerArguments, reporter, system);

                // Create TypeScript compiler options from CLI arguments
                const tsCompilerOptions: ts.CompilerOptions = {};

                // Use TypeScript's built-in parseCommandLine API to convert string options to proper enums
                // Filter out options that TypeScript doesn't recognize (like configFile, client, server, etc.)
                const tsOnlyOptions = Object.fromEntries(
                    Object.entries(rest).filter(([key]) => !["configFile", "client", "server", "addonsDir"].includes(key))
                );

                const cliArguments = Object.entries(tsOnlyOptions)
                    .filter(([_key, value]) => value !== undefined)
                    .flatMap(([key, value]) => {
                        if (typeof value === "boolean") {
                            return value ? [`--${key}`] : [];
                        } else if (Array.isArray(value)) {
                            return value.flatMap(v => [`--${key}`, String(v)]);
                        } else {
                            return [`--${key}`, String(value)];
                        }
                    });

                // Add source files to the CLI arguments - these become fileNames in parseCommandLine
                // Only add if they are actual file paths (not empty or just whitespace)
                if (source && source.length > 0) {
                    const validSourceFiles = source.filter(
                        file =>
                            file &&
                            file.trim() !== "" &&
                            file !== "compile" && // Filter out the command name itself
                            !file.startsWith("--") // Filter out any option flags
                    );
                    if (validSourceFiles.length > 0) {
                        cliArguments.push(...validSourceFiles);
                    }
                }

                const parsedCliArgs = ts.parseCommandLine(cliArguments);

                const normalizedConfig = {
                    ...rest,
                    ...parsedCliArgs.options,
                };

                // Map CLI options to TypeScript compiler options
                // Store string values directly instead of converting to TypeScript enums
                if (options.target) tsCompilerOptions.target = normalizedConfig.target as ts.ScriptTarget;
                if (options.module) tsCompilerOptions.module = normalizedConfig.module as ts.ModuleKind;
                if (options.outDir) tsCompilerOptions.outDir = normalizedConfig.outDir;
                if (options.outFile) tsCompilerOptions.outFile = normalizedConfig.outFile;
                if (options.sourceMap !== undefined) tsCompilerOptions.sourceMap = normalizedConfig.sourceMap;
                if (options.declaration !== undefined) tsCompilerOptions.declaration = normalizedConfig.declaration;
                if (options.declarationMap !== undefined) tsCompilerOptions.declarationMap = normalizedConfig.declarationMap;
                if (options.emitDeclarationOnly !== undefined) tsCompilerOptions.emitDeclarationOnly = normalizedConfig.emitDeclarationOnly;
                if (options.noEmit !== undefined) tsCompilerOptions.noEmit = normalizedConfig.noEmit;
                if (options.strict !== undefined) tsCompilerOptions.strict = normalizedConfig.strict;
                if (options.allowJs !== undefined) tsCompilerOptions.allowJs = normalizedConfig.allowJs;
                if (options.checkJs !== undefined) tsCompilerOptions.checkJs = normalizedConfig.checkJs;
                if (options.removeComments !== undefined) tsCompilerOptions.removeComments = normalizedConfig.removeComments;
                if (options.esModuleInterop !== undefined) tsCompilerOptions.esModuleInterop = normalizedConfig.esModuleInterop;
                if (options.transpileOnly !== undefined) tsCompilerOptions.transpileOnly = normalizedConfig.transpileOnly;
                if (options.jsx) tsCompilerOptions.jsx = normalizedConfig.jsx as ts.JsxEmit;
                if (options.lib) tsCompilerOptions.lib = normalizedConfig.lib;
                if (options.types) tsCompilerOptions.types = normalizedConfig.types;

                // Load and process websmith configuration
                const { config, profile } = buildWebsmithConfig(source, options, system);

                // Pass merged options into compiler
                if (!compiler) {
                    compiler = new Compiler(
                        {
                            ...websmithOptions,
                            tsConfigFile,
                            config,
                            profile,
                            reporter,
                            // Don't pass configFile to prevent websmith-core from reloading it
                            configFile: undefined,
                            // Include the parsed CLI arguments with fileNames
                            cliArgs: parsedCliArgs,
                            tsConfig: {
                                ...websmithOptions.tsConfig,
                                ...tsCompilerOptions,
                            },
                        },
                        {},
                        system,
                        new AddonRegistry({
                            addons: [], // Will be set by profiles
                            addonsDir: config.addonsDir,
                            system,
                            reporter,
                            profiles: config.profiles,
                        })
                    );

                    // Manually set configFile after construction to avoid websmith-core reloading
                    if (options.configFile) {
                        // @ts-expect-error - Setting private property to maintain API compatibility
                        compiler.getOptions().configFile = options.configFile;
                    }
                } else {
                    compiler
                        .setOptions({
                            ...websmithOptions,
                            tsConfigFile,
                            config,
                            profile,
                            reporter,
                            // Don't pass configFile to prevent websmith-core from reloading it
                            configFile: undefined,
                            // Include the parsed CLI arguments with fileNames
                            cliArgs: parsedCliArgs,
                            tsConfig: {
                                ...websmithOptions.tsConfig,
                                ...tsCompilerOptions,
                            },
                        })
                        .setAddonRegistry(
                            new AddonRegistry({
                                addons: [], // Will be set by profiles
                                addonsDir: config.addonsDir,
                                system,
                                reporter,
                                profiles: config.profiles,
                            })
                        );

                    // Manually set configFile after construction to avoid websmith-core reloading
                    if (options.configFile) {
                        // @ts-expect-error - Setting private property to maintain API compatibility
                        compiler.getOptions().configFile = options.configFile;
                    }
                }

                // Run compilation
                if (options.watch) {
                    compiler.watch();
                } else {
                    compiler.compile();
                }
            } catch (error) {
                process.stderr.write(`Compilation failed: ${error instanceof Error ? error.message : String(error)}\n`);
                process.exit(1);
            }
        });
};

const buildWebsmithConfig = (
    _source: string[] | undefined,
    options: CompilerOptions,
    system: ts.System
): { config: CompilationConfig; profile: string | undefined } => {
    let configFileOpts: CompilationConfig = {};
    let profiles: Record<string, CompilationProfile> = {};
    let profile: string | undefined;

    // Create base config
    const baseConfig: CompilationConfig = {};

    // Load user configuration file if specified
    if (options.configFile && system.fileExists(options.configFile)) {
        const configFileContent = system.readFile(options.configFile, "utf-8");
        configFileOpts = configFileContent ? (JSON.parse(configFileContent) as CompilationConfig) : {};

        // Check for addons in user config and warn (addonsDir is allowed)
        if (configFileOpts.addons) {
            process.stderr.write(
                `Custom addon configuration found in "${options.configFile}". Remove option "addons" from configuration file and use "--client" or "--server" parameters instead.\n`
            );
        }

        if (configFileOpts.profiles) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            (Object.entries(configFileOpts.profiles) as [string, CompilationProfile][]).forEach(([profileName, profile]) => {
                if (!["client", "server"].includes(profileName)) {
                    process.stderr.write(
                        `Invalid profile name "${profileName}" found in "${options.configFile}". Remove the profile from the configuration file or rename it to "client" or "server".\n`
                    );
                    delete configFileOpts.profiles![profileName];
                }
                if (profile.addons) {
                    process.stderr.write(
                        `Custom addon configuration found in "${options.configFile}" for profile "${profileName}". Remove option "addons" from configuration file and use "--client" or "--server" parameters instead.\n`
                    );

                    delete configFileOpts.profiles![profileName].addons;
                }
            });

            profiles = configFileOpts.profiles;
        }
    }

    // Build profile based on --client and --server options (outside config file loading)
    if (options.client) {
        profile = "client";
        if (!profiles.client) {
            profiles.client = {};
        }
        // Merge with existing client profile but override addons
        // Disable declaration generation for client proxies (they're runtime code, not library code)
        // This enables 10-20x faster transpileModule fast path
        profiles.client = {
            ...profiles.client,
            addons: ["client-function-transform"],
            tsConfig: {
                ...profiles.client.tsConfig,
                declaration: false,
            },
        };
        // Keep all profiles but ensure client profile has the CLI-specified addons
        profiles = {
            ...profiles,
            client: profiles.client,
        };
    }

    if (options.server) {
        profile = "server";
        if (!profiles.server) {
            profiles.server = {};
        }
        // Merge with existing server profile but override addons
        profiles.server = {
            ...profiles.server,
            addons: ["service-function-generate"],
        };
        // Keep all profiles but ensure server profile has the CLI-specified addons
        profiles = {
            ...profiles,
            server: profiles.server,
        };
    }

    // Determine addons directory - prioritize CLI option, then config file, then default
    let addonsDir: string | undefined;
    try {
        addonsDir = ModuleResolver.resolveAddonsDir(options.addonsDir ?? configFileOpts.addonsDir);
    } catch (err) {
        process.stderr.write(`Error resolving addons directory: ${err instanceof Error ? err.message : String(err)}\n`);
        addonsDir = undefined;
    }

    return {
        config: {
            ...baseConfig,
            ...configFileOpts,
            addons: [],
            addonsDir,
            profiles, // CLI-generated profiles with addons override config file profiles
            ...(options.transpileOnly && { transpileOnly: true }),
            ...(options.addonEmitOnly && { addonEmitOnly: true }),
        },
        profile,
    };
};
