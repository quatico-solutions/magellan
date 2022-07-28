/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

/* eslint-disable no-var */
import { ExecutionContext, TransportFunction } from "@quatico/magellan-shared";
import { getFunctionService } from "../services";
import { Configuration } from "./Configuration";
import { getDefaultConfiguration } from "./default-configuration";

declare global {
    var __qsMagellanServerConfig__: Configuration;
}

export const initProjectConfiguration = (projectConfiguration: Partial<Configuration>): Configuration => {
    return setConfiguration(expandConfig(projectConfiguration));
};

export const getConfiguration = (): Configuration => {
    return global.__qsMagellanServerConfig__ ?? setConfiguration(expandConfig(getDefaultConfiguration()));
};

export const setConfiguration = (config: Configuration): Configuration => {
    return (global.__qsMagellanServerConfig__ = config);
};

export const applyExecutionContext = (context: Partial<ExecutionContext>) => {
    const config = getConfiguration();
    const remappedTransport = (func: TransportFunction): Promise<string> =>
        getFunctionService().invokeFunction({ name: func.name, data: func.payload, namespace: func.namespace });
    config.transports = Object.fromEntries(Object.entries(config.transports).map(([name]) => [name, remappedTransport]));
    if (context.window) {
        context.window.__qsMagellanConfig__ = config;
        context.window.__qsMagellanServerConfig__ = config;
        return;
    }
    if (context.global) {
        context.global.__qsMagellanConfig__ = config;
        context.global.__qsMagellanServerConfig__ = config;
    }
};

const expandConfig = (configuration: Partial<Configuration> | undefined): Configuration => {
    return {
        ...getDefaultConfiguration(),
        ...configuration,
    };
};
