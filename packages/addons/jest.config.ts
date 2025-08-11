/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Config } from "jest";
import { config as baseConfig } from "../../jest-base.config";

const config: Config = {
    ...baseConfig,
    rootDir: __dirname,
    testRegex: "(src|tests)/.*\\.(test|spec)\\.ts$",
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/test-output.*/"],
    watchPathIgnorePatterns: ["/node_modules/", "/dist/", "/test-output.*/"],
};

export default config;
