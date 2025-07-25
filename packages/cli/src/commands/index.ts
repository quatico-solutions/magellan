/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { addCompileCommand } from "../compiler";
import { addServeCommand } from "../server";
import { Command } from "commander";

export const executeCompileCommand = (argv: string[]) => {
    addCompileCommand(new Command()).parse(argv, { from: "user" });
};

export const executeServeCommand = (argv: string[]) => {
    addServeCommand(new Command()).parse(argv, { from: "user" });
};
