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
    testTimeout: 60000, // 1 minute for server integration tests
    maxWorkers: 1, // Run tests sequentially due to shared file system resources
    forceExit: true, // Force Jest to exit after tests complete
    detectOpenHandles: true, // Detect handles that prevent Jest from exiting
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // Setup file for global cleanup
    testRegex: ".*\\.test\\.ts$",
};

export default config;
