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
    context: AddonContext<MagellanConfig>,
    addonName: string,
    addonFn: (context: AddonContext<MagellanConfig>) => (ctx: ts.TransformationContext) => ts.Transformer<ts.SourceFile>
): string | never => {
    if (!isTsAddonApplicable(fileName, context.getCliArgs())) {
        return content;
    }
    if (fileName.endsWith(".d.ts")) {
        return content;
    }
    if (!context.getSystem().fileExists(fileName)) {
        throw new Error(`${addonName} (${fileName}) could not find source file`);
    }

    const sf = ts.createSourceFile(fileName, content, context.getCliArgs().options.target ?? ts.ScriptTarget.Latest, true);
    const compilationOptions = context.getProfileConfig();
    if (!compilationOptions) {
        // When profileConfig is missing, return original content without transformation
        // This allows addons to be specified without profiles (they'll just skip transformation)
        return content;
    }

    const transformResults = ts.transform(sf, [addonFn(context)], context.getCliArgs().options);
    if (transformResults.diagnostics) {
        transformResults.diagnostics.forEach(it => context.getReporter().reportDiagnostic(it));
    }

    const transformedSf = transformResults.transformed.find(it => it.fileName === sf.fileName);
    // Only print if the AST was actually transformed
    // This prevents ts.createPrinter() from reformatting unchanged files
    if (!transformedSf || transformedSf === sf) {
        return content;
    }

    const printed = ts.createPrinter().printFile(transformedSf);

    // Final safety check: if printed content is identical to original, return original
    // This preserves exact formatting when no semantic changes occurred
    return printed === content ? content : printed;
};
