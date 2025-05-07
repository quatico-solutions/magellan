/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export const wildcardMiddleware = (staticDir: string, staticRoute: string) => (req: Request, res: Response, next: NextFunction) => {
    const { baseUrl, url } = req;
    const cleanedFilePath = url.endsWith("/") ? url.substring(0, url.length - 1) : url;
    const staticFilePath = path.join(staticDir, baseUrl, cleanedFilePath);

    fs.stat(staticFilePath, (err, stats) => {
        if (err || stats === undefined || !stats.isFile()) {
            req.url = staticRoute;
        }
        next();
    });
};
