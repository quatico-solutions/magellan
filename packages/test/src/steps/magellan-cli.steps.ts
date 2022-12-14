import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { formdataFetch } from "@quatico/magellan-server";
import assert from "assert";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { basename, extname, isAbsolute, join, resolve } from "path";
import { Cli } from "../cli";

type CliOperation = "compile" | "serve";
let previousPath = ".";
const targetDirectory = resolve("output", "project");
const dataPath = resolve("test", "__data__");
let remoteInvokeResult: unknown;
let remoteInvokeError: unknown;
let remoteInvokeConsoleError: string | undefined;
let projectDirectory: string = targetDirectory;
let cli: Cli;

Given(/^valid TypeScript project directory was created$/, () => {
    mkdirSync(targetDirectory, { recursive: true });
    copyFileSync(resolve(dataPath, "project-template", "tsconfig.json"), resolve(targetDirectory, "tsconfig.json"));
    copyFileSync(resolve(dataPath, "project-template", "websmith.config.json"), resolve(targetDirectory, "websmith.config.json"));
});

Given(/^directory "(.*)" was created$/, path => {
    if (!isAbsolute(path)) {
        path = previousPath ? join(previousPath, path) : path;
        previousPath = path;
    }
    if (!previousPath) {
        projectDirectory = resolve(path);
    }
    mkdirSync(resolve(targetDirectory, previousPath), { recursive: true });
});

Given(/^file "(.*)" without FaaS function was created$/, fileName => {
    writeFileSync(resolve(projectDirectory, previousPath, fileName), `export const ${basename(fileName, extname(fileName))} = () => {}`);
});

Given(/^valid FaaS module file "(.*)" was created$/, fileName => {
    copyFileSync(resolve(dataPath, "faas-modules", fileName), resolve(targetDirectory, previousPath, fileName));
});

Given(/^valid index module file "(.*)" was created$/, fileName => {
    copyFileSync(resolve(dataPath, "index-modules", fileName), resolve(targetDirectory, previousPath, "index.ts"));
});

Given("node environment is {string}", (env: string) => {
    process.env.NODE_ENV = env;
});

When(
    /^CLI command "(.*)" is called without arguments$/,
    // { timeout: 60 * 1000 },
    async (cliOperation: CliOperation) => {
        process.chdir(targetDirectory);
        cli = cli || new Cli();
        switch (cliOperation) {
            case "compile":
                return cli.executeCompile({});
            case "serve": {
                await cli.executeServe({
                    command: { args: `-s ${join(targetDirectory, "lib", "server")} ${join(targetDirectory, "lib", "client")}` },
                });
                // Because cucumber-js runs in the node environment, we need to tell the 'frontend' on what host it is running.
                // Also, because it is node that executes it, we must use the servers default transport on the frontend to have it use node-fetch!
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (global as any).__qsMagellanConfig__ = {
                    // we need to tell the frontend function execution on what host it is running.
                    namespaces: { default: { endpoint: "http://localhost:3000/api" } },
                    transports: { default: formdataFetch },
                };
                break;
            }
            default:
                return Promise.reject(`Unsupported cli operation ${cliOperation}`);
        }
    }
);

When(/^CLI command "(.*)" is called with arguments {string}$/, async (cliOperation: CliOperation, args: string) => {
    process.chdir(targetDirectory);

    cli = cli || new Cli();
    switch (cliOperation) {
        case "compile":
            return cli.executeCompile({
                command: {
                    args: args !== "" ? args.replaceAll(/<projectDir>/g, targetDirectory) : undefined,
                    cwd: resolve(targetDirectory),
                },
            });
        case "serve": {
            await cli.executeServe({
                command: {
                    // args must include at least "-s ./lib/server ./lib/client "
                    args:
                        args !== ""
                            ? args.replaceAll(/<projectDir>/g, targetDirectory)
                            : `-s ${join(targetDirectory, "lib", "server")} ${join(targetDirectory, "lib", "client")}`,
                    cwd: resolve(targetDirectory),
                },
            });
            // Because cucumber-js runs in the node environment, we need to tell the 'frontend' on what host it is running.
            // Also, because it is node that executes it, we must use the servers default transport on the frontend to have it use node-fetch!
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).__qsMagellanConfig__ = {
                // we need to tell the frontend function execution on what host it is running.
                namespaces: { default: { endpoint: "http://localhost:3000/api" } },
                transports: { default: formdataFetch },
            };
            break;
        }
        default:
            return Promise.reject(`Unsupported cli operation ${cliOperation}`);
    }
});

When(
    "the function {string} is invoked",
    // { timeout: 60 * 1000 },
    async function (functionName: string) {
        try {
            const module = await import(join(process.cwd(), "lib", "client", functionName));
            // eslint-disable-next-line no-console
            const errorConsole = console.error;
            // eslint-disable-next-line no-console
            console.error = error => (remoteInvokeConsoleError = error);
            remoteInvokeResult = await module[functionName]();
            // eslint-disable-next-line no-console
            console.error = errorConsole;
        } catch (e) {
            remoteInvokeError = e;
        }
    }
);

When(
    "the function {string} is invoked with {string}",
    //  { timeout: 60 * 1000 },
    async function (functionName: string, data: string) {
        try {
            const module = await import(join(process.cwd(), "lib", "client", functionName));
            // eslint-disable-next-line no-console
            const errorConsole = console.error;
            // eslint-disable-next-line no-console
            console.error = error => (remoteInvokeConsoleError = error);
            remoteInvokeResult = await module[functionName](JSON.parse(data));
            // eslint-disable-next-line no-console
            console.error = errorConsole;
        } catch (e) {
            remoteInvokeError = e;
        }
    }
);

Then(/^directory "(.*)" contains file "(.*)"$/, (directory, fileName) => {
    assert.equal(existsSync(resolve(targetDirectory, directory, fileName)), true, `Directory ${directory} should contain file ${fileName}`);
});

Then("the promise is resolved with {string}.", (result: string) => {
    assert.equal(result, JSON.stringify(remoteInvokeResult));
});

Then("the promise is rejected with message {string}.", (message: string) => {
    assert.equal(message, remoteInvokeError);
});

Then("writes console error {string}.", (error: string) => {
    assert.equal(true, remoteInvokeConsoleError?.toString().includes(error));
});

Then("writes no console error.", () => {
    assert.equal(undefined, remoteInvokeConsoleError);
});

Before(() => {
    rmSync(resolve(targetDirectory, ".."), { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.warn = () => undefined;
    previousPath = ".";
    remoteInvokeConsoleError = undefined;
    remoteInvokeError = undefined;
    remoteInvokeResult = undefined;
});

After(async () => {
    await cli?.cleanup();
    rmSync(resolve(targetDirectory, ".."), { recursive: true, force: true });
});
