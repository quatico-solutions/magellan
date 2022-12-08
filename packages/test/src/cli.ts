/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { executeCompileCommand } from "@quatico/magellan-cli";
import { Configuration } from "@quatico/magellan-server";
import { SHARE_ENV, Worker } from "node:worker_threads";
import { resolve } from "path";

type CompileCommand = {
    args?: string;
    cwd?: string;
};

export class Cli {
    private serveCommandWorker?: Worker;

    public cleanup() {
        this.serveCommandWorker?.terminate();
    }

    public async executeCompile({ command }: { command?: CompileCommand }): Promise<void> {
        const { cwd = ".", args } = command ?? {};
        executeCompileCommand(["compile", ...(args?.split(" ") ?? ""), "-p", `${resolve(cwd, "tsconfig.json")}`]);
    }

    public async executeServe({ command }: { command?: CompileCommand }): Promise<{ config: Configuration }> {
        return new Promise<{ config: Configuration }>((resolvePromise, rejectPromise) => {
            const { cwd = ".", args } = command ?? {};
            const workerData = {
                command: "serve",
                argv: ["serve", ...(args?.split(" ") ?? ""), "-p", `${resolve(cwd, "tsconfig.json")}`],
                env: { NODE_ENV: process.env.NODE_ENV },
            };
            const worker = new Worker(resolve(__dirname, "commandExecutor.js"), {
                workerData,
                env: SHARE_ENV,
            });

            worker.on("error", (err: Error) => {
                // eslint-disable-next-line no-console
                console.error("\nError received from worker: ", err);
                rejectPromise(err);
            });
            worker.on("message", () => {
                const config = {
                    // we need to tell the frontend function execution on what host it is running.
                    namespaces: { default: { endpoint: "http://localhost:3000/api" } },
                    transports: { default: require("@quatico/magellan-server").formdataFetch },
                };
                resolvePromise({ config });
            });

            worker.postMessage({});

            this.serveCommandWorker = worker;
        });
    }
}
