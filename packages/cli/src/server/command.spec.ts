/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */
import { Command } from "commander";
import { mkdirSync } from "fs";
import { getVersion } from "../extract-version";
import { addServeCommand } from "./command";

describe("addServeCommand", () => {
    it("should set the default options w/ valid functionScriptPath", () => {
        setupFolders("./resources", "./server-esm");
        const target = jest.fn();

        addServeCommand(new Command(), target).parse(["serve", "./resources"], { from: "user" });

        expect(target).toHaveBeenCalledWith({
            debug: false,
            serverModuleDir: "./server-esm",
            port: 3000,
            staticDir: "./resources",
        });
    });

    it("should output the cli version", () => {
        setupFolders("./resources", "./server-esm");
        const target = jest.fn();
        console.info = target;

        addServeCommand(new Command(), jest.fn()).parse(["serve", "./resource", "-s", "./server-esm"], { from: "user" });

        expect(target).toHaveBeenCalledWith(`Magellan version ${getVersion()}`);
    });

    it("should show the command help w/o staticDir", () => {
        process.exit = jest.fn() as any;
        process.stderr.write = jest.fn();
        const target = jest.fn();

        addServeCommand(new Command(), target).parse(["serve"]);

        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("should set serverModuleDir w/ --serverModuleDir cli argument", () => {
        setupFolders("./resources", "./expected-module-dir");
        const target = jest.fn();

        addServeCommand(new Command(), target).parse(["serve", "./resources", "-s", "./expected-module-dir"], { from: "user" });

        expect(target).toHaveBeenCalledWith(expect.objectContaining({ serverModuleDir: "./expected-module-dir" }));
    });

    it("should show the command help and error out w/ non-existent serverModuleDir", () => {
        setupFolders("./resources");
        console.error = line => {
            throw new Error(line.toString());
        };

        expect(() => addServeCommand(new Command(), jest.fn()).parse(["serve", "./resources", "-s", "./server-module"], { from: "user" })).toThrow(
            `moduleDir "./server-module" does not exist!\nPlease verify your arguments.`
        );
    });

    it("should set debug w/ --debug cli argument", () => {
        setupFolders("./resources", "./server-esm");
        const target = jest.fn();

        addServeCommand(new Command(), target).parse(["serve", "./resources", "--debug"], { from: "user" });

        expect(target).toHaveBeenCalledWith(expect.objectContaining({ debug: true }));
    });

    it("should set port w/ --port cli argument", () => {
        setupFolders("./resources", "./server-esm");
        const target = jest.fn();

        addServeCommand(new Command(), target).parse(["serve", "./resources", "--port", "9999"], { from: "user" });

        expect(target).toHaveBeenCalledWith(expect.objectContaining({ port: 9999 }));
    });
});

const setupFolders = (...paths: string[]) => {
    paths.forEach(path => {
        mkdirSync(path);
    });
};
