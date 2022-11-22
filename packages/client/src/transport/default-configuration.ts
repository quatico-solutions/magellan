/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import config from "./config";
import { Configuration } from "./Configuration";
import { formdataFetch } from "./formdata-fetch";

export const getDefaultConfiguration = (): Configuration => {
    return completeConfig(config);
};

export const completeConfig = (config: Configuration): Configuration => {
    return {
        namespaces: Object.fromEntries(
            Object.entries(config.namespaces ?? []).map(([name, mapping]) => [
                name,
                !mapping.endpoint ? { endpoint: "/api", transport: mapping.transport } : mapping,
            ])
        ),
        transports: Object.fromEntries(Object.entries(config.transports ?? []).map(([name, transport]) => [name, transport ?? formdataFetch])),
    };
};
