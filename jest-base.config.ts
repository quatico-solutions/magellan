/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Config } from "jest";

export const config: Config = {
    collectCoverageFrom: ["**/*.{ts,tsx}"],
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: ["index.ts", "test/*"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "@quatico/magellan-cli": "<rootDir>/../cli/src",
        "@quatico/magellan-shared": "<rootDir>/../shared/src",
        "@quatico/magellan-client": "<rootDir>/../client/src",
        "@quatico/magellan-server": "<rootDir>/../server/src",
    },
    prettierPath: null,
    setupFilesAfterEnv: ["../../jest.setup.ts"],
    testRegex: ".*spec\\.(jsx?|tsx?)$",
    transform: {
        "^.+\\.(js|ts)$": ["ts-jest", { diagnostics: false }],
    },
    resetMocks: true,
    clearMocks: true,
    // Watchman configuration to prevent conflicts
    watchman: true,
    watchPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/lib/",
        "<rootDir>/bin/",
        "<rootDir>/dist/",
        "<rootDir>/build/",
        "<rootDir>/coverage/",
        "<rootDir>/.gradle/",
        "<rootDir>/target/",
        "\\.watchman-.*",
        "test-output.*",
    ],
    // Optimize haste map for better performance
    haste: {
        enableSymlinks: false,
        forceNodeFilesystemAPI: false,
    },
};
