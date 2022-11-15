/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { getDependencyContext } from "../services";
import { Configuration } from "./Configuration";

export const getDefaultConfiguration = () => {
    return completeConfig({
        namespaces: { default: { endpoint: "/api", transport: "default" } },
        transports: { default: getDependencyContext().defaultTransportHandler },
    });
};

export const completeConfig = (config: Configuration): Configuration => {
    return {
        namespaces: Object.fromEntries(
            Object.entries(config.namespaces ?? []).map(([name, mapping]) => [
                name,
                !mapping.endpoint ? { endpoint: "/api", transport: mapping.transport } : mapping,
            ])
        ),
        transports: Object.fromEntries(
            Object.entries(config.transports ?? []).map(([name, transport]) => [name, transport ?? getDependencyContext().defaultTransportHandler])
        ),
    };
};
