/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */

import cookieParser from "cookie-parser";
import express, { Application, ErrorRequestHandler, Express, NextFunction, Request, Response } from "express";
import http from "http";
import createError from "http-errors";
import logger from "morgan";
import multer from "multer";
import { join, resolve } from "path";
import { loadModules } from "./module-loader";
import { createFunctionRoute, createStaticRoute } from "./routes";
import { Sdk } from "./sdk";

import cors from "cors";
import { existsSync } from "fs";

export interface ServerOptions {
    app?: Express;
    debug?: boolean;
    serverModuleDir?: string;
    port?: number;
    requireFn?: NodeRequire;
    sdk?: Sdk;
    server?: http.Server;
    staticRoute?: string;
    staticDir?: string;
}

export const serve = (options: ServerOptions): void => {
    const { port = normalizePort(process.env.PORT) } = options;

    const app = setupApp(options);
    const server = options.server ?? http.createServer(app);

    server.listen(port, () => console.debug(`magellan serve started on http://localhost:${port}`));
};

export const setupApp = (options: ServerOptions): Application => {
    const {
        app = express(),
        serverModuleDir: moduleDir = resolve(process.env.MODULE_DIR ?? "."),
        port = normalizePort(process.env.PORT),
        requireFn = require,
        sdk = new Sdk(),
        staticRoute = "/",
        staticDir = resolve(process.cwd(), process.env.STATIC_DIR ?? "."),
    } = options;

    app.set("port", port);
    app.use(express.json());
    app.use(multer().any());

    app.use(
        cors({
            origin: "*",
        })
    );
    app.use(logger("dev"));
    app.use(cookieParser());

    // Redirects static requests to the static route
    app.get(/.*/, function (req, res, next) {
        const { baseUrl, url } = req;
        const cleanedFilePath = url.endsWith("/") ? url.substring(0, url.length - 1) : url;
        const staticFilePath = join(staticDir, baseUrl, cleanedFilePath);
        if (!existsSync(staticFilePath)) {
            req.url = staticRoute;
        }
        next();
    });

    app.use(staticRoute, createStaticRoute(staticDir, staticRoute));
    app.use("/api", createFunctionRoute());

    // catch 404 and forward to error handler
    app.use((req: Request, res: Response, next: NextFunction) => {
        next(createError(404, `Cannot ${req.method} "${req.path}". No resource found.`));
    });

    app.use(handleError);

    if (moduleDir) {
        loadModules(moduleDir, requireFn, sdk);
    }

    return app;
};

export const handleError: ErrorRequestHandler = (err, req, res) => {
    const { status = 500, message } = err;

    // set locals, only providing error in development
    res.locals.message = message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // TODO: Create better error page and render it
    res.status(status);
    res.render(`Could not handle request. Reason: "${message}".`);
};

export const normalizePort = (port = "3000"): number => {
    try {
        const result = parseInt(port, 10);
        if (!isNaN(result)) {
            return result;
        }
    } catch (err) {
        // falls through
    }
    return 3000;
};
