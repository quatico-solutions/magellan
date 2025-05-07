/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { assert } from "@quatico/magellan-shared";
import { formdataFetch } from "./formdata-fetch";
import { getConfiguration } from "./configuration-repository";
import { type ResolvedNamespace } from "./ResolvedNamespace";

const DEFAULT_NAMESPACE = "default";
const DEFAULT_TRANSPORT = "default";

export const setNamespace = (namespace: string, mapping: NamespaceMapping): void => {
    const config = getConfiguration();
    config.namespaces = config.namespaces || {};
    if (config.namespaces[namespace] && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.info(`Namespace "${namespace}" already exists. Updating mapping.`);
    }
    config.namespaces[namespace] = mapping;
};

export const setTransport = (name: string, handler: TransportHandler): void => {
    const config = getConfiguration();
    config.transports = config.transports || {};
    if (config.transports[name] && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.info(`Transport "${name}" already exists. Updating handler.`);
    }
    config.transports[name] = handler;
};

export const resolveNamespace = (namespace = DEFAULT_NAMESPACE, defaultEndpoint = "/api"): ResolvedNamespace => {
    const config = getConfiguration();
    if (namespace === DEFAULT_NAMESPACE) {
        return {
            name: namespace,
            endpoint: config.namespaces[DEFAULT_NAMESPACE].endpoint ?? defaultEndpoint,
            transport: config.transports[DEFAULT_TRANSPORT] ?? formdataFetch,
        };
    }
    const resolvedNamespace = config.namespaces[namespace];
    assert(!!resolvedNamespace, `Failed to resolve namespace "${namespace}". No configuration found.`);
    const resolvedTransport = config.transports[resolvedNamespace.transport || DEFAULT_TRANSPORT] ?? formdataFetch;
    return { name: namespace, endpoint: resolvedNamespace.endpoint, transport: resolvedTransport };
};
