/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import ts from "typescript";
import { isTsAddonApplicable } from "./addon-helpers";
import { type MagellanConfig } from "./magellan-config";

export const createBaseTransformer = (
    fileName: string,
    content: string,
    ctx: AddonContext<MagellanConfig>,
    addonName: string,
    addonFn: () => (ctx: ts.TransformationContext) => ts.Transformer<ts.SourceFile>
): string | never => {
    if (!isTsAddonApplicable(fileName, ctx.getConfig())) {
        return content;
    }
    if (fileName.endsWith(".d.ts")) {
        return content;
    }
    if (!ctx.getSystem().fileExists(fileName)) {
        throw new Error(`${addonName} (${fileName}) could not find source file`);
    }

    const sf = ts.createSourceFile(fileName, content, ctx.getConfig().options.target ?? ts.ScriptTarget.Latest, true);
    const compilationOptions = ctx.getTargetConfig();
    if (!compilationOptions) {
        throw new Error(`${addonName} targetConfig is missing`);
    }

    const transformResults = ts.transform(sf, [addonFn()], ctx.getConfig().options);
    if (transformResults.diagnostics) {
        // eslint-disable-next-line no-console, @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
        transformResults.diagnostics.forEach(it => console.error(`[${it.category}] - ${it.messageText}`));
    }

    const transformedSf = transformResults.transformed.find(it => it.fileName === sf.fileName);
    return transformedSf ? ts.createPrinter().printFile(transformedSf) : content;
};
