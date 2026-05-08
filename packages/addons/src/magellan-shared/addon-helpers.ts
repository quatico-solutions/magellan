/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type ts from "typescript";
import { type MagellanConfig } from "./magellan-config";
import { type AddonContext, ErrorMessage } from "@quatico/websmith-api";

export const isTsAddonApplicable = (fileName: string, config: ts.ParsedCommandLine): boolean => {
    return config.fileNames.includes(fileName);
};

export const validateRuntimeLibrary = (libraryName: string, context: AddonContext<MagellanConfig>) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const runtimeInvoke = require(libraryName);
    if (!runtimeInvoke) {
        context
            .getReporter()
            .reportDiagnostic(new ErrorMessage(`${libraryName} missing. Please add it as development dependency to your package.json.`));
    }
    return runtimeInvoke;
};
