module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "prettier",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:jest/recommended",
        "plugin:jest/style",
    ],
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: __dirname + "/tsconfig.lint.json",
        sourceType: "module",
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    },
    settings: {
        jest: {
            version: 29,
        },
        "import/resolver": {
            alias: {
                map: [
                    ["@quatico/magellan-shared", __dirname + "/packages/shared/src"],
                    ["@quatico/magellan-addons", __dirname + "/packages/addons/src"],
                    ["@quatico/magellan-cli", __dirname + "/packages/cli/src"],
                    ["@quatico/magellan-client", __dirname + "/packages/client/src"],
                    ["@quatico/magellan-server", __dirname + "/packages/server/src"],
                ],
                extensions: [".ts", ".js", ".jsx", ".json"],
            },
        },
    },
    env: {
        node: true,
    },
    rules: {
        // Override default rules due to significant performance impact
        "import/namespace": "off",
        "import/no-named-as-default": "off",
        "import/default": "off",
        "import/no-named-as-default-member": "off",
        // "import/no-cycle": ["error", { maxDepth: Infinity }], // Enable this rule to detect dependency cycles,
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-var-requires": "warn",
        "arrow-parens": ["error", "as-needed"],
        "max-len": ["warn", { code: 150, tabWidth: 4 }],
        "no-console": "error",
        "prettier/prettier": "off",
        curly: "error",
    },
    ignorePatterns: ["node_modules", "*.min.js", "lib", "dist", "bin", "__data__"],
    overrides: [
        {
            files: ["**/*.test.js", "**/*.test.ts", "**/*.spec.ts"],
            env: {
                jest: true,
            },
            rules: {
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-non-null-assertion": "off",
                "max-len": "off",
            },
        },
    ],
};
