/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import fs from "fs";

export type AdditionalSource = {
    fileName: string;
    source: string;
};
export const getClientOutput = (fileName = "test") => {
    const target = `lib/${fileName}.js`;

    expect(fs.existsSync(target)).toBe(true);

    return fs.readFileSync(target).toString();
};

export const getClientDtsOutput = (fileName = "test") => {
    const target = `lib/${fileName}.d.ts`;

    expect(fs.existsSync(target)).toBe(true);

    return fs.readFileSync(target).toString();
};

export const getServerOutput = (fileName = "test") => {
    const target = `server-esm/${fileName}.js`;

    expect(fs.existsSync(target)).toBe(true);

    return fs.readFileSync(target).toString();
};

export const getServerDtsOutput = (fileName = "test") => {
    const target = `server-esm/${fileName}.d.ts`;

    expect(fs.existsSync(target)).toBe(true);

    return fs.readFileSync(target).toString();
};

export const updateSource = (source: string) => fs.writeFileSync("functions/test.ts", source);
export const getClientSourceMap = () => fs.readFileSync("functions/test.js.map").toString();
export const getServerSourceMap = () => fs.readFileSync("server-esm/test.js.map").toString();