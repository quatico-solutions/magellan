/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

/* eslint-disable no-var */
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

const expandConfig = (configuration: Partial<Configuration> | undefined): Configuration => {
    return {
        ...getDefaultConfiguration(),
        ...configuration,
    };
};
