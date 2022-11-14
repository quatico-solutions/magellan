/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
module.exports = {
    preset: "ts-jest",
    collectCoverageFrom: ["**/*.{ts,tsx}"],
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: ["index.ts", "test/*"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "@quatico/magellan-shared": "<rootDir>/packages/shared/src",
        "@quatico/magellan-client": "<rootDir>/packages/client/src",
        "@quatico/magellan-server": "<rootDir>/packages/server/src",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    testRegex: ".*spec\\.(jsx?|tsx?)$",
    testEnvironmentOptions: { url: "http://localhost/" },
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": [
            "@swc/jest",
            {
                jsc: {
                    parser: {
                        syntax: "typescript",
                    },
                    transform: {
                        react: {
                            runtime: "automatic",
                        },
                    },
                },
            },
        ],
    },
    resetMocks: true,
    watchman: false,
};
