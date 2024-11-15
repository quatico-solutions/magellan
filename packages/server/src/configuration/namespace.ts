/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { getDependencyContext } from "../services";
import { getConfiguration } from "./configuration-repository";
import { ResolvedNamespace } from "./ResolvedNamespace";

export const setNamespace = (namespace: string, mapping: NamespaceMapping): void => {
    const config = getConfiguration();
    if (config.namespaces[namespace]) {
        // eslint-disable-next-line no-console
        console.info(`Namespace "${namespace}" already exists. Updating mapping.`);
    }
    config.namespaces[namespace] = mapping;
};

export const setTransport = (name: string, handler: TransportHandler): void => {
    const config = getConfiguration();
    if (config.transports[name]) {
        // eslint-disable-next-line no-console
        console.info(`Transport "${name}" already exists. Updating handler.`);
    }
    config.transports[name] = handler;
};

export const resolveNamespace = (namespace = "default", defaultEndpoint = "/api"): ResolvedNamespace => {
    const config = getConfiguration();
    const resolvedNamespace = config.namespaces[namespace] ?? { endpoint: defaultEndpoint, transport: "default" };
    const resolvedTransport = config.transports[resolvedNamespace.transport || "default"] ?? getDependencyContext().defaultTransportHandler;
    return { name: namespace, endpoint: resolvedNamespace.endpoint, transport: resolvedTransport };
};
