/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { AddonContext, TargetConfig } from "@quatico/websmith-api";
import * as ts from "typescript";
import { isTsAddonApplicable } from "../magellan-shared/addon-helpers";
import { MagellanConfig } from "../magellan-shared/magellan-config";
import { createClientTransformer } from "./transformer-client";

export const createTransformer = (fileName: string, content: string, ctx: AddonContext<TargetConfig>): string | never => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!isTsAddonApplicable(fileName, ctx.getConfig() as any)) {
        return content;
    }
    if (fileName.endsWith(".d.ts")) {
        return content;
    }
    if (!ctx.getSystem().fileExists(fileName)) {
        throw new Error(`client-function-transform (${fileName}) could not find source file`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sf = ts.createSourceFile(fileName, content, ctx.getConfig().options.target ?? (ts.ScriptTarget.Latest as any), true);
    const compilationOptions = ctx.getTargetConfig() as MagellanConfig;
    if (!compilationOptions) {
        throw new Error("client-function-transform targetConfig is missing");
    }

    // FIXME: ctx.getSystem().resolvePath is the root for our chdir need. If we can overcome this, we might be free of said pain!
    const transformResults = ts.transform(
        sf,
        [createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: ctx.resolvePath(compilationOptions.functionsDir) })],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx.getConfig().options as any
    );
    if (transformResults.diagnostics) {
        // eslint-disable-next-line no-console
        transformResults.diagnostics.forEach(it => console.error(`[${it.category}] - ${it.messageText}`));
    }

    const transformedSf = transformResults.transformed.find(it => it.fileName === sf.fileName);
    return transformedSf ? ts.createPrinter().printFile(transformedSf) : content;
};
