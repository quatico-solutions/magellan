/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { executeCompileCommand } from "@quatico/magellan-cli";
import { join, resolve } from "path";
import { ServerRunner } from "./ServerRunner";

type CompileCommand = {
    args?: string;
    cwd?: string;
};

export class Cli {
    private serverRunner?: ServerRunner;

    public async cleanup() {
        await this.serverRunner?.cleanup();
    }
    public async executeCompile({ command }: { command?: CompileCommand }): Promise<void> {
        const { cwd = ".", args } = command ?? {};
        executeCompileCommand(["compile", ...(args?.split(" ") ?? ""), "-p", `${resolve(cwd, "tsconfig.json")}`]);
    }

    public async executeServe({ command }: { command?: CompileCommand }): Promise<void> {
        const { args } = command ?? {};
        this.serverRunner = this.serverRunner || new ServerRunner();
        // eslint-disable-next-line no-console
        console.info(`\nExecute Debug ServerRunner: ${!!process.env["TEST_DEBUG_OUTPUT"]}`);
        await this.serverRunner.executeServe({
            command: {
                scriptPath: join(__dirname, "..", "..", "cli", "lib", "cli.js"),
                args,
                ...(!!process.env["TEST_DEBUG_OUTPUT"] && { debugOutput: true }),
            },
        });
    }
}
