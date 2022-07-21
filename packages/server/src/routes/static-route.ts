/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import express, { Router } from "express";

export const createStaticRoute = (path: string) => {
    const router = Router();
    // eslint-disable-next-line no-console
    console.debug(`Serving ${path}\n`);
    return router.use(express.static(path));
};
