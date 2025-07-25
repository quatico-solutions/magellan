import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { dirname, join, resolve } from "path";
import webpack from "webpack";

const __dirname = dirname(new URL(import.meta.url).pathname);
const outputPath = resolve(__dirname, "dist");

export default (env, options) => {
    const isProduction = options.mode === "production";
    /** @type {import('webpack').Configuration} */
    const config = {
        mode: options.mode,
        devtool: isProduction ? undefined : "eval-cheap-module-source-map",
        devServer: {
            static: [
                {
                    directory: resolve(__dirname, "static"),
                    publicPath: "/",
                },
            ],
            watchFiles: ["src/**/*", "static/**/*"],
            port: 3030,
            open: "/index.html",
        },
        entry: [resolve(__dirname, "src/index.tsx")],
        resolve: { extensions: [".tsx", ".ts", ".js"] },
        output: {
            filename: "js/[name].bundle.js",
            path: outputPath,
            publicPath: "",
        },
        target: !isProduction ? "web" : "browserslist",
        module: {
            rules: [
                env.WITH_MAGELLAN
                    ? {
                          test: /\.[jt]sx?$/,
                          include: [join(__dirname, "src/services"), join(__dirname, "node_modules", "@quatico", "magellan-client")],
                          exclude: [/\.spec\.tsx?$/, /node_modules/],
                          loader: "websmith-loader",
                          options: {
                              debug: !isProduction,
                              tsConfigFile: join(__dirname, "tsconfig.json"),
                              configFile: join(__dirname, "websmith.config.json"),
                              profile: "client",
                          },
                      }
                    : {},
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
                {
                    test: /\.(s?css)$/,
                    use: [
                        "style-loader",
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    plugins: [["postcss-preset-env"]],
                                },
                            },
                        },
                        "sass-loader",
                    ],
                },
                {
                    test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/,
                    type: "asset/resource",
                },
            ],
        },
        plugins: [
            new webpack.ProgressPlugin(),
            new HtmlWebpackPlugin({
                template: "./static/index.html",
                favicon: "./static/favicon.ico",
                inject: true,
                minify: false,
            }),
            new MiniCssExtractPlugin({
                filename: "css/[name].css",
            }),
        ],
    };
    return config;
};
