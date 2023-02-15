/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { ErrorRequestHandler, Express, NextFunction, Request, Response } from "express";
import http from "http";
import createError from "http-errors";
import multer from "multer";
import { resolve } from "path";
import { wildcardMiddleware } from "./middlewares";
import { loadModules } from "./module-loader";
import { createFunctionRoute, createStaticRoute } from "./routes";
import { Sdk } from "./sdk";

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
    setupMagellanModules(options);
    startServer({ app, port, server: options.server });
};

export const startServer = ({ app, port, server = http.createServer(app) }: { app: express.Express; port: number; server?: http.Server }) => {
    server.listen(port, () => console.info(`magellan serve started on http://localhost:${port}`));
};

export const setupApp = (options: ServerOptions): express.Express => {
    const {
        app = options.app ?? express(),
        port = normalizePort(process.env.PORT),
        staticRoute = "/",
        staticDir = resolve(process.cwd(), process.env.STATIC_DIR ?? "."),
    } = options;

    app.set("port", port);
    app.use(
        cors({
            origin: "*",
        })
    );

    configureRequestMiddlewares({ app });
    configureMagellanRoutes({ app, staticDir, staticRoute, apiRoute: "/api" });

    configureErrorHandling({ app });
    return app;
};

export const setupMagellanModules = (options: ServerOptions) => {
    const { serverModuleDir: moduleDir = resolve(process.env.MODULE_DIR ?? "."), requireFn = require, sdk = new Sdk() } = options;
    refreshModules({ moduleDir, requireFn, sdk });
};

const refreshModules = ({ moduleDir, requireFn, sdk }: { moduleDir: string; requireFn: NodeRequire; sdk: Sdk }) => {
    if (moduleDir) {
        loadModules(moduleDir, requireFn, sdk);
    }
};

export const configureErrorHandling = ({ app }: { app: express.Express }) => {
    // catch 404 and forward to error handler
    app.use((req: Request, res: Response, next: NextFunction) => {
        next(createError(404, `Cannot ${req.method} "${req.path}". No resource found.`));
    });

    app.use(handleError);
};

export const configureRequestMiddlewares = ({ app }: { app: express.Express }) => {
    // Configure express application/json processing
    app.use(express.json());
    // Configure multipart/form-data processing
    app.use(multer().any());

    // Configure cookie parsing
    app.use(cookieParser());
};

type MagellanRouteConfiguration = {
    app: express.Express;
    staticDir: string;
    staticRoute: string;
    apiRoute: string;
};

export const configureMagellanRoutes = ({ app, staticDir, staticRoute, apiRoute }: MagellanRouteConfiguration) => {
    app.get(/.*/, [wildcardMiddleware(staticDir, staticRoute)]);
    app.use(staticRoute, createStaticRoute(staticDir, staticRoute));
    app.use(apiRoute, createFunctionRoute());
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