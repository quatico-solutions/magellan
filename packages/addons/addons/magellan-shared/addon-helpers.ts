/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";

export const isTsAddonApplicable = (fileName: string, config: ts.ParsedCommandLine): boolean => {
    return config.fileNames.includes(fileName);
};

export const validateRuntimeLibrary = (libraryName: string): void | never => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const runtimeInvoke = require(libraryName);
    if (!runtimeInvoke) {
        throw new Error(`${libraryName} missing. Please add it as development dependency to your package.json.`);
    }
};