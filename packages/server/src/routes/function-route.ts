/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { RequestPayload, ResponsePayload } from "@quatico/magellan-shared";
import { serialize, serializeError, unpackObject } from "@quatico/magellan-shared";
import { Request as ExpressRequest, Response, Router } from "express";
import { Sdk } from "../sdk";

export const createFunctionRoute = (sdk = new Sdk()) => {
    const router = Router();

    new Sdk().init();
    router.post(
        "/",
        async (
            req: ExpressRequest<{ name: string }, ResponsePayload<unknown> /* ResBody */, RequestPayload /* ReqBody */>,
            res: Response<ResponsePayload<unknown>>
        ) => {
            const { name, data = "{}", namespace = "default" } = req.body;
            res.set("Content-Type", "application/json");
            try {
                const input = unpackObject(JSON.parse(data));
                const response = await sdk.invokeFunction(name, input, namespace);
                res.end(serialize(response), () =>
                    // eslint-disable-next-line no-console
                    console.debug(`Request to ${name} finished.`)
                );
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const error: any = err;
                res.status(200).end(serializeError({ error: error.message ?? error.toString(), message: `Function request to "${name}" failed.` }));
            }
        }
    );

    return router;
};
