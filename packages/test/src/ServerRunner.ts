/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */
import { ChildProcess, exec } from "child_process";

type Command = {
    scriptPath?: string;
    debugOutput?: boolean;
    args?: string;
};

export class ServerRunner {
    private childProcesses: ChildProcess[] = [];
    private abortControllers: AbortController[] = [];

    public async cleanup() {
        this.abortControllers.forEach(ac => ac.abort());
        this.abortControllers = [];
        this.childProcesses = [];
        return new Promise<void>(resolve => setTimeout(() => resolve(), 5000));
    }

    public async executeServe({ command }: { command?: Command }): Promise<void> {
        return new Promise<void>(resolvePromise => {
            const { args = "", scriptPath, debugOutput } = command ?? {};
            const ac = new AbortController();
            this.abortControllers.push(ac);
            console.warn(`Execute node ${scriptPath} ${args}`);
            const childProcess = exec(`node ${scriptPath} serve ${args}`, {
                shell: "/bin/bash",
                signal: ac.signal,
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV },
            });
            debugOutput && childProcess.on("error", err => console.debug(`\nserverRunner finished with:`, err));
            childProcess.stdout?.on("data", data => {
                debugOutput && console.info(`Child Info: ${data}`);
                if (data.toString().includes("magellan serve started on http://localhost:")) {
                    resolvePromise();
                }
            });
            debugOutput && childProcess.stderr?.on("data", data => console.error(`Child Error: ${data.toString()}`));
            childProcess.on("uncoughtException", err => process.exit(err && !err.toString().includes("AbortError") ? 1 : 0));
            this.childProcesses.push(childProcess);
        });
    }
}
