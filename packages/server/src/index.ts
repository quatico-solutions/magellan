/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import type { Context } from "./api";
import type { Configuration } from "./configuration";
import {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    applyExecutionContext,
    initProjectConfiguration,
    resolveNamespace,
    setNamespace,
    setTransport
} from "./configuration";
import type { ServerOptions } from "./server";
import { configureMagellanRoutes, configureRequestMiddlewares, serve, setupMagellanModules, startServer } from "./server";
import { getFunctionService } from "./services";
import { formdataFetch } from "./transport";

export type { ServerOptions, Configuration, Context, NamespaceMapping, TransportHandler };
export {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    applyExecutionContext,
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
