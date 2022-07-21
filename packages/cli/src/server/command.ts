/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { serve, ServerOptions } from "@quatico/magellan-server";
import { Command } from "commander";
import { existsSync } from "fs";
import { createOptions, getServerModuleDir } from "./options";

export const addServeCommand = (parent = new Command(), serveFn: (options: ServerOptions) => void = serve): Command => {
    parent
        .command("serve")
        .showSuggestionAfterError()
        .argument("<staticDir>", "relative path to the directory that holds static content to be served")
        .showHelpAfterError("Add --help for additional information.")
        .description(
            `Starts the Magellan server for remote function execution.` +
                ` Use the "compile" command to provide functions that can be called on the server.`
        )
        .option("-s, --serverModuleDir <serverModuleDir>", "relative path to the directory that holds the server module(s)")
        .option("-p, --port <port>", "port for the standalone HTTP server", num => parseInt(num, 10), 3000)
        .option("-d, --debug", "enable the output of debug information", false)
        .action((staticDir: string, args: Partial<ServerOptions>, command: Command) => {
            const serverModuleDir = getServerModuleDir(args);
            if (typeof serverModuleDir !== "string") {
                // eslint-disable-next-line no-console
                console.warn(
                    `moduleDir "unspecified" does not exist!\nNo services will be provided. If this was not your intention, try using --help.`
                );
            } else if (!existsSync(serverModuleDir)) {
                // eslint-disable-next-line no-console
                console.error(`moduleDir "${serverModuleDir}" does not exist!\nPlease verify your arguments.`);
                command.help({ error: true });
            }

            serveFn(createOptions(args, staticDir));
        });

    return parent;
};
