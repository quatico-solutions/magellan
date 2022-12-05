/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { executeCompileCommand, executeServeCommand } from "@quatico/magellan-cli";
import { resolve } from "path";

type CompileCommand = {
    args?: string;
    cwd?: string;
};

export class Cli {
    public async executeCompile({ command }: { command?: CompileCommand }): Promise<void> {
        const { cwd = ".", args } = command ?? {};
        executeCompileCommand(["compile", ...(args?.split(" ") ?? ""), "-p", `${resolve(cwd, "tsconfig.json")}`]);
    }

    public async executeServe({ command }: { command?: CompileCommand }): Promise<void> {
        const { cwd = ".", args } = command ?? {};
        executeServeCommand(["serve", ...(args?.split(" ") ?? ""), "-p", `${resolve(cwd, "tsconfig.json")}`]);
    }
}
