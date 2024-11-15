/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

/* eslint-disable no-var */
import type { NamespaceMapping } from "@quatico/magellan-shared";
import { Configuration } from "./Configuration";
import { getDefaultConfiguration } from "./default-configuration";

export const initProjectConfiguration = (projectConfiguration: Partial<Configuration>): Configuration => {
    return setConfiguration(expandConfig(projectConfiguration));
};

export const getConfiguration = (): Configuration => {
    return global.__qsMagellanServerConfig__ ?? setConfiguration(expandConfig(getDefaultConfiguration()));
};

export const setConfiguration = (config: Configuration): Configuration => {
    return (global.__qsMagellanServerConfig__ = config);
};

export const expandConfig = (configuration: Partial<Configuration> | undefined): Configuration => {
    return {
        namespaces: {
            ...(getDefaultConfiguration().namespaces ?? {}),
            ...completeNamespaces(configuration?.namespaces ?? {}),
        },
        transports: { ...(getDefaultConfiguration().transports ?? {}), ...(configuration?.transports ?? {}) },
    };
};

const completeNamespaces = (namespaceMapping: Record<string, NamespaceMapping>): Record<string, NamespaceMapping> => {
    Object.entries(namespaceMapping).forEach(([key, value]) => {
        namespaceMapping[key] = completeNamespace(value);
    });
    return namespaceMapping;
};

const completeNamespace = (mapping: NamespaceMapping): NamespaceMapping => {
    return { transport: "default", ...mapping };
};
