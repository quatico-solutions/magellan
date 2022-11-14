/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { TransportFunction, TransportHandler } from "@quatico/magellan-shared";
import type { Context } from "../configuration";

export const formdataFetch: TransportHandler = async (func: TransportFunction, ctx: Context): Promise<string> => {
    const { name, payload, namespace, endpoint } = func;

    if (!name) {
        throw new Error('Cannot invoke remote function without "name" property.');
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: createFormData({ name, payload, namespace }),
            headers: createHeaders({ headers: ctx.headers }),
        });
        return await response.text();
    } catch (err) {
        throw new Error(`Cannot invoke remote function: "${name}". Reason: "${err}".`);
    }
};

export const createHeaders = ({ headers }: { headers: Headers } = { headers: new Headers() }) => {
    headers.set("Accept", "application/json");
    return headers;
};

export const createFormData = ({ name, payload, namespace }: { name: string; payload: string; namespace: string }): FormData => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("data", payload);
    formData.set("namespace", namespace);
    return formData;
};
