/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { Sdk } from "./sdk";

export const loadModules = (dirPath: string, requireFn: NodeRequire = require, sdk: Sdk = new Sdk()) => {
    recursiveFind(dirPath, it => path.extname(it) === ".js")
        .map(it => requireFn(path.resolve(it)))
        .forEach(it => {
            Object.keys(it).forEach(key => sdk.registerFunction(key, it[key]));
        });
};

export const recursiveFind = (dirPath: string, filter: (path: string) => boolean = () => true): string[] => {
    try {
        return fs
            .readdirSync(dirPath)
            .flatMap(cur =>
                fs.lstatSync(path.join(dirPath, cur)).isDirectory() ? recursiveFind(path.join(dirPath, cur), filter) : path.join(dirPath, cur)
            )
            .filter(filter);
    } catch (_ignored) {
        return [];
    }
};
