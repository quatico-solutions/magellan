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
import { wildcardMiddleware } from "./middlewares";
import { loadModules } from "./module-loader";
import { createFunctionRoute, createStaticRoute } from "./routes";
import { Sdk } from "./sdk";

import cors from "cors";
import { createWriteStream } from "fs";
import { TerminalStream } from "./TerminalStream";

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

    server.listen(port, () => console.info(`magellan serve started on http://localhost:${port}`));
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

    registerLoggers(app);

    app.use(cookieParser());

    app.get(/.*/, [wildcardMiddleware(staticDir, staticRoute)]);

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

export const registerLoggers = (app: express.Express) => {
    logger.token("funcName", req => {
        return (req as any)?.body?.name ?? "unknown";
    });
    app.use(
        logger(":remote-addr [:date[clf]] :method :status :res[content-length] ':funcName' - :response-time ms", {
            skip: req => !/^\/api$/.test(req.baseUrl) && !/^\/api$/.test(req.url),
            stream: createWriteStream(join(process.cwd(), "api-access.log"), { flags: "a" }),
        })
    );
    app.use(
        logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
            skip: req => /^\/api$/.test(req.baseUrl) || /^\/api$/.test(req.url),
            stream: createWriteStream(join(process.cwd(), "access.log"), { flags: "a" }),
        })
    );

    const skipSuccess = (req: any, res: any) => res.statusCode < 400;
    const skipError = (req: any, res: any) => res.statusCode >= 400;
    app.use(
        logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
            skip: skipSuccess,
            stream: createWriteStream(join(process.cwd(), "error.log"), { flags: "a" }),
        })
    );
    app.use(
        logger("combined", {
            skip: skipError,
            stream: new TerminalStream(),
        })
    );
};