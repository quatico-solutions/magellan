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
    coveragePathIgnorePatterns: ["index.ts", "test/*"],
    globals: {
        "ts-jest": {
            tsconfig: "./tsconfig.test.json",
        },
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    testEnvironment: "node",
    testRegex: "(src|test)/.*spec\\.(jsx?|tsx?)$",
    setupFilesAfterEnv: ["<rootDir>/../../jest.setup.ts"],
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
    },
    resetMocks: true,
};
