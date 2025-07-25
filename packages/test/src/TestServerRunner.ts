/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */
import { type ChildProcess, exec } from "child_process";

type Command = {
    scriptPath?: string;
    debugOutput?: boolean;
    args?: string;
};

export class TestServerRunner {
    private childProcesses: ChildProcess[] = [];
    private abortControllers: AbortController[] = [];

    public async cleanup() {
        // Abort all controllers
        this.abortControllers.forEach(ac => ac.abort());
        this.abortControllers = [];

        // Explicitly kill all child processes
        this.childProcesses.forEach(cp => {
            if (cp && cp.pid && !cp.killed) {
                try {
                    process.kill(cp.pid, "SIGTERM");
                    // If SIGTERM doesn't work, force kill after 2 seconds
                    setTimeout(() => {
                        if (cp && cp.pid && !cp.killed) {
                            try {
                                process.kill(cp.pid, "SIGKILL");
                            } catch (_ignored) {
                                // Process might already be dead
                            }
                        }
                    }, 2000);
                } catch (_ignored) {
                    // Process might already be dead
                }
            }
        });

        this.childProcesses = [];

        // Wait a short time for cleanup
        return new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
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
            if (debugOutput) {
                childProcess.on("error", err => console.debug(`\nserverRunner finished with:`, err));
            }
            childProcess.stdout?.on("data", data => {
                if (debugOutput) {
                    console.info(`Child Info: ${data}`);
                }
                if (data.toString().includes("Initialize Sdk with configuration")) {
                    resolvePromise();
                }
            });
            if (debugOutput) {
                childProcess.stderr?.on("data", data => console.error(`Child Error: ${data.toString()}`));
            }
            childProcess.on("uncoughtException", err => process.exit(err && !err.toString().includes("AbortError") ? 1 : 0));
            this.childProcesses.push(childProcess);
        });
    }
}
