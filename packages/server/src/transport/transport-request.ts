/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type Context, deserialize, type RemoteFunction, type Serialization, serialize } from "@quatico/magellan-shared";
import { resolveNamespace } from "../configuration";

export const transportRequest = async <O = void>(
    func: RemoteFunction,
    ctx: Context = { client: { headers: {} } },
    serialization: Serialization = { serialize, deserialize }
): Promise<O> => {
    const { name, data = {}, namespace = "default" } = func;

    if (!name) {
        throw new Error('Cannot invoke remote function without "name" property.');
    }

    let payload: string;
    try {
        payload = serialization.serialize(data);
    } catch (_err) {
        throw new Error(`Cannot serialize input parameter for remote function: "${name}".`);
    }

    const { endpoint, transport } = resolveNamespace(namespace);

    try {
        const result = await transport({ name, payload, namespace, endpoint }, ctx);
        const { data, error } = serialization.deserialize(result);
        if (error?.error) {
            // eslint-disable-next-line no-console
            console.error(`Function request to "${name}" failed with error ${error.error}`);
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return error ? Promise.reject(error.message) : (data as O);
    } catch (err) {
        throw new Error(`Cannot deserialize response from invoke function: "${name}". Reason: "${err}".`);
    }
};
