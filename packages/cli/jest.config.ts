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
    watchPathIgnorePatterns: ["<rootDir>/test-output*"],
};

export default config;
