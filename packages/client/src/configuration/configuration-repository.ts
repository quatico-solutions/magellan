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
    var __qsMagellanConfig__: Configuration;
}

export const initProjectConfiguration = (projectConfiguration: Configuration): Configuration => {
    return persistConfig(expandConfig(projectConfiguration));
};

export const getConfiguration = (): Configuration => {
    return global.__qsMagellanConfig__ ?? persistConfig(expandConfig(getDefaultConfiguration()));
};

const expandConfig = (configuration: Configuration | undefined): Configuration => {
    return {
        ...getDefaultConfiguration(),
        ...configuration,
    };
};

const persistConfig = (configuration: Configuration): Configuration => {
    return (global.__qsMagellanConfig__ = configuration);
};
