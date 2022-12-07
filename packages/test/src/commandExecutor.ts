/* eslint-disable no-console */
import { executeServeCommand } from "@quatico/magellan-cli";
import { parentPort, workerData } from "worker_threads";

parentPort?.on("message", messageHandler);

async function messageHandler() {
    if (!parentPort) {
        throw new Error("parentPort null??");
    }

    const { command, argv } = workerData;
    if (command === "serve") {
        const infoCatcher = new Promise<void>(resolve => {
            console.error(`Node env used for serve is: ${process.env.NODE_ENV}`);
            executeServeCommand(argv);
            console.info = message => {
                if (message === "magellan serve started on http://localhost:3000") {
                    resolve();
                }
            };
        });

        await infoCatcher;

        parentPort.postMessage({});
        return;
    }
    throw new Error(`Unknown command ${command}`);
}
