/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

module.exports = {
    preset: "ts-jest",
    collectCoverageFrom: ["./src/**/*.{ts,tsx}"],
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: ["index.ts"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "@quatico/magellan-shared": "<rootDir>/../shared/src",
    },
    testEnvironment: "node",
    roots: ["<rootDir>/src/", "<rootDir>/../../test/"],
    testRegex: "src/.*spec\\.(jsx?|tsx?)$",
    setupFilesAfterEnv: ["<rootDir>/../../jest.setup.ts"],
    transform: {
        "^.+\\.(j|t)sx?$": [
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
