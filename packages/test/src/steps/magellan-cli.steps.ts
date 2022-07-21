import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { basename, extname, isAbsolute, join, resolve } from "path";
import { Cli } from "../cli";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import assert from "assert";

type CliOperation = "compile";
let previousPath = ".";
const targetDirectory = resolve("output", "project");
const dataPath = resolve("test", "__data__");
let projectDirectory: string = targetDirectory;

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

When(/^CLI command "(.*)" is called without arguments$/, async (cliOperation: CliOperation) => {
    process.chdir(targetDirectory);
    // eslint-disable-next-line no-console
    console.warn(`Current working directory: ${process.cwd()}`);
    return cliOperation === "compile" ? new Cli().executeCompile({}) : Promise.reject(`Unsupported cli operation ${cliOperation}`);
});

When(/^CLI command "(.*)" is called with arguments "(.*)"$/, async (cliOperation: CliOperation, args: string) => {
    process.chdir(targetDirectory);
    return cliOperation === "compile"
        ? new Cli().executeCompile({
              command: {
                  args: args !== "" ? args.replaceAll(/<projectDir>/g, targetDirectory) : undefined,
                  cwd: resolve(targetDirectory),
              },
          })
        : Promise.reject(`Unsupported cli operation ${cliOperation}`);
});

Then(/^directory "(.*)" contains file "(.*)"$/, (directory, fileName) => {
    assert.equal(existsSync(resolve(targetDirectory, directory, fileName)), true, `Directory ${directory} should contain file ${fileName}`);
});

Before(() => {
    rmSync(resolve(targetDirectory, ".."), { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.warn = () => undefined;
});

After(() => {
    rmSync(resolve(targetDirectory, ".."), { recursive: true, force: true });
});
