#!/usr/bin/env ts-node
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { Command } from "commander";
import { addCompileCommand } from "./compiler";
import { getVersion } from "./extract-version";
import { addServeCommand } from "./server";

const command = new Command();
addCompileCommand(command);
addServeCommand(command);
command.addHelpText("beforeAll", `Magellan version ${getVersion()}`);
command.parse(process.argv);
