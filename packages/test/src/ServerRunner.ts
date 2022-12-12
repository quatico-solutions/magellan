/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
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
        // @ts-ignore
        return new Promise<void>(resolvePromise => {
            const { args = "", scriptPath, debugOutput } = command ?? {};
            const ac = new AbortController();
            this.abortControllers.push(ac);
            // eslint-disable-next-line no-console
            console.warn(`Execute node ${scriptPath} ${args}`);
            const childProcess = exec(`node ${scriptPath} serve ${args}`, {
                shell: "/bin/bash",
                // shell: false,
                // detached: true,
                signal: ac.signal,
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV },
            });
            // eslint-disable-next-line no-console
            debugOutput && childProcess.on("error", err => console.debug(`\nserverRunner finished with:`, err));
            childProcess.stdout?.on("data", data => {
                // eslint-disable-next-line no-console
                debugOutput && console.info(`Child Info: ${data}`);
                if (data.toString().includes("magellan serve started on http://localhost:")) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    resolvePromise();
                }
            });
            // eslint-disable-next-line no-console
            childProcess.stderr?.on("data", data => console.error(`Child Error: ${data.toString()}`));
            childProcess.on("uncoughtException", err => process.exit(err && !err.toString().includes("AbortError") ? 1 : 0));
            this.childProcesses.push(childProcess);
        });
    }
}
