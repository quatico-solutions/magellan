module.exports = {
    extends: ["../../.eslintrc.js"],
    rules: {
        // Override default rules due to significant performance impact
        "import/namespace": "off",
        "import/no-named-as-default": "off",
        "import/default": "off",
        "import/no-named-as-default-member": "off",
        // "import/no-cycle": ["error", { maxDepth: Infinity }], // Enable this rule to detect dependency cycles
    },
};
