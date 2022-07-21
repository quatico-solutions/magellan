/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { assert } from "@quatico/magellan-shared";
import { formdataFetch } from "../transport";
import { NamespaceMapping, ServerConfig, TransportHandler } from "./Configuration";
import { getConfiguration, setConfiguration } from "./configuration-repository";
import { ResolvedNamespace } from "./ResolvedNamespace";

export const addNamespace = (namespace: string, mapping: NamespaceMapping): void | never => {
    const config = getConfiguration();
    assert(!config.namespaces[namespace], `Namespace ${namespace} already registered.`);
    config.namespaces[namespace] = mapping;
};

export const addTransport = (name: string, handler: TransportHandler): void | never => {
    const config = getConfiguration();
    assert(!config.transports[name], `Transport ${name} already registered.`);
    config.transports[name] = handler;
};

export const resolveNamespace = (namespace = "default", defaultEndpoint = "/api"): ResolvedNamespace => {
    const config = getConfiguration();
    const resolvedNamespace = config.namespaces[namespace] ?? { endpoint: defaultEndpoint, transport: "default" };
    const resolvedTransport = config.transports[resolvedNamespace.transport || "default"] ?? formdataFetch;
    return { name: namespace, endpoint: resolvedNamespace.endpoint, transport: resolvedTransport };
};

export const setServerConfig = (serverConfig: ServerConfig) => {
    setConfiguration({ ...getConfiguration(), serverConfig });
};
