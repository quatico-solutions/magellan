/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/// <reference types="./types/global.d.ts" />
import type { Configuration } from "./configuration";
import { initProjectConfiguration, resolveNamespace, setNamespace, setTransport } from "./configuration";
import type { ServerOptions } from "./server";
import { configureMagellanRoutes, configureRequestMiddlewares, serve, setupMagellanModules, startServer } from "./server";
import { getFunctionService } from "./services";
import { formdataFetch } from "./transport";

export {
    configureMagellanRoutes,
    configureRequestMiddlewares,
    formdataFetch,
    getFunctionService,
    initProjectConfiguration,
    resolveNamespace,
    serve,
    setNamespace,
    setTransport,
    setupMagellanModules,
    startServer,
};
export type { Configuration, ServerOptions };
