/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const globals = require("globals");
const js = require("@eslint/js");
const ts = require("typescript-eslint");
const jest = require("eslint-plugin-jest");
const prettier = require("eslint-config-prettier");
const { fixupPluginRules } = require("@eslint/compat");
const importPlugin = require("eslint-plugin-import");
const testingLibrary = require("eslint-plugin-testing-library");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const eslintPluginUnicorn = require("eslint-plugin-unicorn");

module.exports = [
    js.configs.recommended,
    ...ts.configs.recommendedTypeChecked,
    jest.configs["flat/recommended"],
    prettier,
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "./tsconfig.lint.json",
                sourceType: "module",
                ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
            },
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
                ...globals.node,
                BUILD_HOSTED: true,
            },
        },
        plugins: {
            import: fixupPluginRules(importPlugin),
            "testing-library": fixupPluginRules(testingLibrary),
            unicorn: eslintPluginUnicorn,
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: __dirname + "/tsconfig.lint.json",
                ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        settings: {
            "import/parsers": {
                espree: [".js", ".cjs", ".mjs", ".jsx"],
                "@typescript-eslint/parser": [".ts", ".tsx"],
            },
            "import/resolver": {
                alias: {
                    map: [
                        ["@quatico/magellan-shared", __dirname + "/packages/shared/src"],
                        ["@quatico/magellan-addons", __dirname + "/packages/addons/src"],
                        ["@quatico/magellan-cli", __dirname + "/packages/cli/src"],
                        ["@quatico/magellan-client", __dirname + "/packages/client/src"],
                        ["@quatico/magellan-react", __dirname + "/packages/react/src"],
                        ["@quatico/magellan-server", __dirname + "/packages/server/src"],
                    ],
                    extensions: [".ts", ".js", ".jsx", ".json"],
                },
                typescript: {
                    alwaysTryTypes: true,
                    project: ["./tsconfig.lint.json"],
                },
            },
        },
        rules: {
            ...jest.configs["flat/recommended"].rules,
            ...importPlugin.configs["recommended"].rules,

            "@typescript-eslint/no-unsafe-call": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-return": "warn",
            "@typescript-eslint/unbound-method": "warn",
            "@typescript-eslint/no-var-requires": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],

            // when using https://www.npmjs.com/package/expect-type, we need consider `expectTypeOf` as an assertion:
            "jest/expect-expect": ["error", { assertFunctionNames: ["expect", "expectTypeOf"] }],

            "no-console": "error",
            "arrow-parens": ["error", "as-needed"],
            "max-len": ["warn", { code: 150, tabWidth: 4 }],
            "unicorn/prefer-node-protocol": "off",
            "unicorn/import-style": "error",
            curly: "error",
        },
    },
    {
        files: ["**/*.test.js", "**/*.test.ts", "**/*.spec.ts"],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "max-len": "off",
            "no-console": "off",
        },
    },
    { ignores: ["**/dist/*", "**/lib/*"] },
];
