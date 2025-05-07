/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Config } from "jest";

const config: Config = {
    rootDir: "./",
    projects: ["<rootDir>/packages/*/jest.config.ts"],
    collectCoverage: false,
};

export default config;
