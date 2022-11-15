/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
module.exports = {
    preset: "ts-jest",
    collectCoverageFrom: ["./src/**/*.ts"],
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: ["index.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    moduleNameMapper: {
        "@quatico/magellan-client": "<rootDir>/../client/src",
        "@quatico/magellan-server": "<rootDir>/../server/src",
    },
    testRegex: "(src|addons)/.*\\.spec\\.(js|ts)$",
    setupFilesAfterEnv: ["<rootDir>/../../jest.setup.ts"],
    testEnvironmentOptions: { url: "http://localhost/" },
    transform: {
        "^.+\\.(js|ts)$": [
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
};
