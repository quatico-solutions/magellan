/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { type NamespaceMapping } from "@quatico/magellan-shared";
import { type Configuration } from "./Configuration";
import { getDefaultConfiguration } from "./default-configuration";

export const initProjectConfiguration = (projectConfiguration: Partial<Configuration>): Configuration => {
    return persistConfig(expandConfig(projectConfiguration));
};

export const getConfiguration = (): Configuration => {
    const defaultConfiguration = getDefaultConfiguration();
    return globalThis.__qsMagellanConfig__ && !configurationNeedsMerge(defaultConfiguration)
        ? globalThis.__qsMagellanConfig__
        : persistConfig(expandConfig(globalThis.__qsMagellanConfig__));
};

const configurationNeedsMerge = (configuration: Partial<Configuration>): boolean => {
    return (
        configuration.merge ||
        (globalThis.__qsMagellanConfig__?.lastMerged !== undefined && globalThis.__qsMagellanConfig__?.lastMerged !== configuration)
    );
};

export const expandConfig = (configuration: Partial<Configuration> | undefined): Configuration => {
    const defaultConfiguration = getDefaultConfiguration();
    return {
        namespaces: completeNamespaces({ ...defaultConfiguration.namespaces, ...configuration?.namespaces }),
        transports: { ...(defaultConfiguration.transports ?? {}), ...(configuration?.transports ?? {}) },
        ...(defaultConfiguration && !!defaultConfiguration?.merge && { lastMerged: defaultConfiguration }),
    };
};

const persistConfig = (configuration: Configuration): Configuration => {
    return (globalThis.__qsMagellanConfig__ = configuration);
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
