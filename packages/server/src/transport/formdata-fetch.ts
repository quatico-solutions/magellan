/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { TransportFunction, TransportHandler } from "@quatico/magellan-shared";
import type { Context } from "../api";
import { getConfiguration } from "../configuration";

export const formdataFetch: TransportHandler = async (func: TransportFunction, ctx: Context): Promise<string> => {
    const { name, payload, namespace, endpoint } = func;

    if (!name) {
        throw new Error('Cannot invoke remote function without "name" property.');
    }

    try {
        const formData = createFormData({ name, payload, namespace });
        const response = await fetch(completeEndpoint(endpoint), {
            method: "POST",
            body: formData,
            headers: createHeaders({ headers: ctx.headers }),
        });
        if (!response.ok) {
            return Promise.reject({ status: response.status, message: response?.statusText || "" });
        }
        return await response.text();
    } catch (err) {
        throw new Error(`Cannot invoke remote function: "${name}". Reason: "${err}".`);
    }
};

export const completeEndpoint = (endpoint: string) => {
    return endpoint.startsWith("/") ? getHostpath(endpoint) : validHttpOrHttpsUrlOrThrow(endpoint);
};

const validHttpOrHttpsUrlOrThrow = (endpoint: string): string => {
    let url;
    try {
        url = new URL(endpoint);
    } catch (err) {
        throw new Error(`provided endpoint ${endpoint} is invalid`);
    }
    if (!/^https?:$/.test(url.protocol)) {
        throw new Error(`provided endpoint ${endpoint} is invalid`);
    }
    return endpoint;
};

export const createHeaders = ({ headers }: { headers: Record<string, string> } = { headers: {} }) => {
    headers["Accept"] = "application/json";
    return headers;
};

export const createFormData = ({ name, payload, namespace }: { name: string; payload: string; namespace: string }): FormData => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("data", payload);
    formData.append("namespace", namespace);
    return formData;
};

const getHostpath = (path: string): string => {
    const config = getConfiguration().serverConfig ?? { url: "http://localhost", port: 3000 };
    return `${config.url}:${config.port}${path}`;
};
