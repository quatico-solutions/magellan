const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: "production",
    target: "node",
    entry: "./src/cli.ts",
    output: {
        filename: "magellan.js",
        path: path.resolve(__dirname, "bin"),
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@quatico/magellan-shared": path.resolve(__dirname, "../shared/src"),
            "@quatico/magellan-client": path.resolve(__dirname, "../client/src"),
            "@quatico/magellan-server": path.resolve(__dirname, "../server/src"),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                        transpileOnly: true,
                    },
                },
            },
        ],
    },
    externals: {
        // Keep these as external Node.js built-ins
        typescript: "commonjs typescript",
    },
    node: {
        // Keep Node.js globals for dynamic addon loading
        __dirname: false,
        __filename: false,
        global: false,
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: "#!/usr/bin/env node",
            raw: true,
        }),
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("production"),
        }),
        // Make the output file executable
        {
            apply: compiler => {
                compiler.hooks.afterEmit.tap("MakeExecutable", () => {
                    const fs = require("fs");
                    const outputPath = path.resolve(__dirname, "bin", "magellan.js");
                    if (fs.existsSync(outputPath)) {
                        fs.chmodSync(outputPath, "755");
                    }
                });
            },
        },
    ],
    optimization: {
        minimize: false, // Keep readable for debugging
    },
    stats: {
        warnings: false,
    },
};
