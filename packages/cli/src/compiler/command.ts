/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

/* eslint-disable no-console */
import { addCompileCommand as addWebsmithCompileCommand } from "@quatico/websmith-compiler";
import { Compiler } from "@quatico/websmith-core";
import { Command } from "commander";
import parseArgs from "minimist";
import { getVersion } from "../extract-version";
import { CliArguments } from "./CliArguments";

export const addCompileCommand = (parent = new Command(), compiler?: Compiler) => {
    parent
        .command("compile")
        .showSuggestionAfterError()
        // .argument("<functionDir>", "relative path to the directory that holds functions to be compiled")
        .showHelpAfterError("Add --help for additional information.")
        .description("Compiles typescript source code and creates server-proxies for remote function execution.")
        .option("-a, --addonsDir <directoryPath>", "path to the addons directory")
        .option("-c, --config <filePath>", 'file path to the "websmith.config.json"', "./websmith.config.json")
        .option("-h, --hostname <name>", "hostname for the standalone HTTP server", "http://localhost")
        .option(
            "-p, --port <port>",
            "port for the standalone HTTP server",
            num => (typeof num === "string" && !isNaN(parseInt(num, 10)) ? parseInt(num, 10) : 3000),
            3000
        )
        // .option("-s, --serverModuleDir <path>", "relative path to output directory of the created server module(s)", "./server-esm")
        .option("-d, --debug", "enable the output of debug information", false)
        .option("-p, --project <projectPath>", 'file path to the "tsconfig.json"', "./tsconfig.json")
        .option(
            "-t, --targets <targetList>",
            "Comma-separated list of compilation target names to use specific configuration and list of addons.",
            "client,server"
        )
        .option("-w, --watch", "enable watch mode", false)
        .allowUnknownOption(true)
        .hook("preAction", command => {
            if (command.opts().profile) {
                console.time("command duration");
            }
        })
        .hook("postAction", command => {
            if (command.opts().profile) {
                console.timeEnd("command duration");
            }
        })
        .action((args: CliArguments, command: Command) => {
            // eslint-disable-next-line no-console
            console.info(`Magellan version ${getVersion()}`);
            if (command.args) {
                const unknownArgs = command.args.filter(arg => !command.getOptionValueSource(arg));
                if (unknownArgs?.length > 0) {
                    const args = parseUnknownArguments(unknownArgs);
                    let showHelp = false;
                    args.forEach((value: unknown, key: string) => {
                        console.error(
                            `Unknown Argument "${key}".` + `\nIf this is a tsc command, please configure it in your typescript configuration file.\n`
                        );
                        showHelp = true;
                    });
                    if (showHelp) {
                        command.help({ error: true });
                    }
                }
            }

            let cliArguments = Object.entries(args)
                .filter(([key, value]) => ["debug", "watch"].includes(key) && value)
                .map(([key]) => `--${key}`);

            Object.entries(args)
                .filter(([key]) => ["addonsDir", "config", "hostname", "port", "project", "targets"].includes(key))
                .forEach(([key, value]) => {
                    cliArguments.push(`--${key}`, `${value}`);
                });

            cliArguments = addRequiredTargetsIfMissing(cliArguments);
            addWebsmithCompileCommand(new Command() as any, compiler).parse(cliArguments, { from: "user" });
        });
    return parent;
};

const addRequiredTargetsIfMissing = (cliArguments: string[]) => {
    const targetIndex = cliArguments.findIndex(it => it.startsWith("--targets"));
    if (targetIndex > -1) {
        let entry = cliArguments[targetIndex + 1];
        if (!entry.includes("client")) {
            entry += ",client";
        }
        if (!entry.includes("server")) {
            entry += ",server";
        }
        cliArguments[targetIndex + 1] = entry;
    } else {
        cliArguments.push("--targets", "client,server");
    }
    return cliArguments;
};

const parseUnknownArguments = (unknownArgs: string[]): Map<string, unknown> => {
    const result = new Map<string, unknown>();
    const args = parseArgs(unknownArgs);
    for (const key in args) {
        if (key === "_") {
            if (args[key].length > 0) {
                result.set(
                    "undefined",
                    args[key].map(cur => (isPotentiallyJson(cur) ? JSON.parse(cur) : cur))
                );
            }
        } else {
            result.set(key, isPotentiallyJson(args[key]) ? JSON.parse(args[key]) : args[key]);
        }
    }
    return result;
};

const isPotentiallyJson = (arg: string): boolean =>
    typeof arg !== "string" ? false : (arg.startsWith("{") && arg.endsWith("}")) || (arg.startsWith("[") && arg.endsWith("]"));
