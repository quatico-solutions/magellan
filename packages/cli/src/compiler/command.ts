import { Compiler, DefaultReporter } from "@quatico/websmith-compiler";
import { AddonRegistry, createOptions, type CompilationConfig } from "@quatico/websmith-core";
import { Command } from "commander";
import ts from "typescript";
import { ModuleResolver } from "./module-resolver";

export const addCompileCommand = (parent = new Command(), compiler?: Compiler): Command => {
    return parent
        .name("magellan")
        .command("compile")
        .description("Compile TypeScript functions annotated with @service() for client and server use with Magellan")
        .showSuggestionAfterError()
        .showHelpAfterError("Add --help for additional information.")
        .argument("[source...]", "Source directory or files to compile (optional)")
        .option("-c, --configFile <filePath>", 'File path to the "./websmith.config.json" file.')
        .option("--client", "Apply client-side transformations (client-function-transform addon)")
        .option("--server", "Apply server-side transformations (service-function-generate addon)")
        .option("--debug", "Enable the output of debug information.")
        .option("-p, --project <projectPath>", "Compile the project given the path to its configuration file, or to a folder with a 'tsconfig.json'.")
        .option("-o, --transpileOnly", "Enable the transpile only mode.")
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
            "-t, --target",
            "Set the JavaScript language version for emitted JavaScript and include compatible library declarations.\n" +
                "one of:  es5, es5, es6/es2015, es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext"
        )
        .option("-m, --module", "Specify what module code is generated.\n" + "one of:  commonjs, amd, umd, system, esnext, none")
        .option(
            "--lib",
            "Specify a set of bundled library declaration files that describe the target runtime environment.\n" +
                "one or more:  es5, es6/es2015, es7/es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext, dom, dom.iterable, dom.asynciterable, webworker, webworker.importscripts, webworker.iterable, webworker.asynciterable, scripthost, es2015.core, es2015.collection, es2015.generator, es2015.iterable, es2015.promise, es2015.proxy, es2015.reflect, es2015.symbol, es2015.symbol.wellknown, es2016.array.include, es2016.intl, es2017.arraybuffer, es2017.date, es2017.object, es2017.sharedmemory, es2017.string, es2017.intl, es2017.typedarrays, es2018.asyncgenerator, es2018.asynciterable/esnext.asynciterable, es2018.intl, es2018.promise, es2018.regexp, es2019.array, es2019.object, es2019.string, es2019.symbol/esnext.symbol, es2019.intl, es2020.bigint/esnext.bigint, es2020.date, es2020.promise, es2020.sharedmemory, es2020.string, es2020.symbol.wellknown, es2020.intl, es2020.number, es2021.promise, es2021.string, es2021.weakref/esnext.weakref, es2021.intl, es2022.array, es2022.error, es2022.intl, es2022.object, es2022.string, es2022.regexp, es2023.array, es2023.collection, es2023.intl, es2024.arraybuffer, es2024.collection, es2024.object/esnext.object, es2024.promise/esnext.promise, es2024.regexp/esnext.regexp, es2024.sharedmemory, es2024.string/esnext.string, esnext.array, esnext.collection, esnext.intl, esnext.disposable, esnext.decorators, esnext.iterator, decorators, decorators.legacy"
        )
        .option("--allowJs", "Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files.")
        .option("--checkJs", "Enable error reporting in type-checked JavaScript files.")
        .option("--jsx", "Specify what JSX code is generated.\n" + "one of:  preserve, react, react-jsx, react-jsxdev, react-jsx, react-jsxdev")
        .option(
            "--outFile",
            "Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output."
        )
        .option("--outDir", "Specify an output folder for all emitted files.")
        .option("--removeComments", "Disable emitting comments.")
        .option("--strict", "Enable all strict type-checking options.")
        .option("--types", "Specify type package names to be included without being referenced in a source file.")
        .option(
            "--esModuleInterop",
            "Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility."
        )
        .action((source, options) => {
            try {
                const system = ts.sys;
                const reporter = new DefaultReporter(system);
                const tsConfigFile = options.project ?? "./tsconfig.json";

                const { client, server, ...rest } = options;

                // Validate that client and server options are not used together
                if (client && server) {
                    process.stderr.write("error: options --client and --server cannot be used together\n");
                    process.exit(1);
                }

                // Create the base options using websmith's createOptions
                const websmithOptions = createOptions(rest, reporter, system);

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
                } else {
                    compiler
                        .setOptions({
                            ...websmithOptions,
                            tsConfigFile,
                            config,
                            profile,
                            reporter,
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
    source: string | string[] | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any, // TODO: fix this
    system: ts.System
): { config: CompilationConfig; profile: string | undefined } => {
    let configFileOpts: CompilationConfig = {};
    let profiles: Record<string, unknown> = {};
    let profile: string | undefined;
    // Include source files in config if provided
    if (source?.length) {
        options.sourceFiles = Array.isArray(source) ? source : [source];
    }

    // Load user configuration file if specified
    if (options.configFile && system.fileExists(options.configFile)) {
        const configFileContent = system.readFile(options.configFile, "utf-8");
        configFileOpts = configFileContent ? (JSON.parse(configFileContent) as CompilationConfig) : {};

        // Check for addons in user config and warn
        if (configFileOpts.addons || configFileOpts.addonsDir) {
            process.stderr.write(
                `Custom addon configuration found in "${options.configFile}". Remove options "addons" and "addonsDir" from configuration file and use "--client" or "--server" parameters instead.\n`
            );
        }

        if (configFileOpts.profiles) {
            Object.entries(configFileOpts.profiles).forEach(([profileName, profile]) => {
                if (!["client", "server"].includes(profileName)) {
                    process.stderr.write(
                        `Invalid profile name "${profileName}" found in "${options.configFile}". Remove the profile from the configuration file or rename it to "client" or "server".\n`
                    );
                    delete configFileOpts.profiles![profileName];
                }
                if (profile.addons) {
                    process.stderr.write(
                        `Custom addon configuration found in "${options.configFile}" for profile "${profileName}". Remove options "addons" and "addonsDir" from configuration file and use "--client" or "--server" parameters instead.\n`
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
        profiles = {
            client: profiles.client,
        };
    }

    if (options.server) {
        profile = "server";
        profiles = {
            server: profiles.server,
        };
    }

    // Determine addons directory - use installed @quatico/magellan-addons package
    let addonsDir: string | undefined;
    try {
        addonsDir = ModuleResolver.resolveAddonsDir();
    } catch (err) {
        process.stderr.write(`Error resolving addons directory: ${err instanceof Error ? err.message : String(err)}\n`);
        addonsDir = undefined;
    }

    return {
        config: {
            ...configFileOpts,
            addons: profile === "client" ? ["client-function-transform"] : ["service-function-generate"],
            addonsDir,
            profiles,
            ...(options.transpileOnly && { transpileOnly: true }),
        },
        profile,
    };
};
