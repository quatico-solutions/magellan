import { NextFunction, Request, Response } from "express";
import { exists } from "fs";
import { join } from "path";

export const wildcardMiddleware = (staticDir: string, staticRoute: string) => (req: Request, res: Response, next: NextFunction) => {
    const { baseUrl, url } = req;
    const cleanedFilePath = url.endsWith("/") ? url.substring(0, url.length - 1) : url;
    const staticFilePath = join(staticDir, baseUrl, cleanedFilePath);

    exists(staticFilePath, fileExists => {
        if (!fileExists) {
            req.url = staticRoute;
        }
        next();
    });
};
