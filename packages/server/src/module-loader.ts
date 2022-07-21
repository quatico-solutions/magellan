/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { lstatSync, readdirSync } from "fs";
import { extname, join, resolve } from "path";
import { Sdk } from "./sdk";

export const loadModules = (dirPath: string, requireFn: NodeRequire = require, sdk: Sdk = new Sdk()) => {
    const imports = recursiveFind(dirPath, it => extname(it) === ".js").map(it => requireFn(resolve(it)));
    for (const cur in imports) {
        Object.keys(imports[cur]).forEach(key => sdk.registerFunction(key, imports[cur][key]));
    }
};

export const recursiveFind = (path: string, filter: (path: string) => boolean = () => true): string[] => {
    try {
        return readdirSync(path)
            .flatMap(cur => (lstatSync(join(path, cur)).isDirectory() ? recursiveFind(join(path, cur), filter) : join(path, cur)))
            .filter(filter);
    } catch (ignored) {
        return [];
    }
};
