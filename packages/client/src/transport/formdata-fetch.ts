/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { TransportFunction, TransportHandler } from "@quatico/magellan-shared";
import type { Context } from "./Context";

export const formdataFetch: TransportHandler = async (func: TransportFunction, ctx: Context): Promise<string> => {
    const { name, endpoint } = func;

    if (!name) {
        throw new Error('Cannot invoke remote function without "name" property.');
    }

    try {
        const response = await fetch(endpoint, { method: "POST", body: createFormData(func), headers: createHeaders({ headers: ctx.headers }) });
        if (!response.ok) {
            return Promise.reject({ status: response.status, message: response?.statusText || "" });
        }
        return await response.text();
    } catch (err) {
        throw new Error(`Cannot invoke remote function: "${name}". Reason: "${err}".`);
    }
};

export const createHeaders = ({ headers }: { headers: Record<string, string> } = { headers: {} }) => {
    headers["Accept"] = "application/json";
    return headers;
};

export const createFormData = ({ name, payload, namespace }: TransportFunction): FormData => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("data", payload);
    formData.set("namespace", namespace);
    return formData;
};
