/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import {readFileSync} from "fs";
import {resolve} from "path";
import assert from "assert";

export const contentEqual = (generatedSrc: string, functionName: string, project: string) => {
    const path = resolve("test", "__data__", "output", project, `${functionName}.ts`);
    const output = readFileSync(path).toString();
    assert.equal(generatedSrc, output, `The source at ${path} and the generated code ${generatedSrc} should match.`);
};