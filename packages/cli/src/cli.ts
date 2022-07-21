#!/usr/bin/env ts-node
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { Command } from "commander";
import { addServeCommand } from "./server";
import { addCompileCommand } from "./compiler";

const command = new Command();
addCompileCommand(command);
addServeCommand(command);
command.parse(process.argv);
