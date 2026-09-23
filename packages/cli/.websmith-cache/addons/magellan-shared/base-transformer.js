"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseTransformer = void 0;
const typescript_1 = __importDefault(require("typescript"));
const addon_helpers_1 = require("./addon-helpers");
const createBaseTransformer = (fileName, content, context, addonName, addonFn) => {
    if (!(0, addon_helpers_1.isTsAddonApplicable)(fileName, context.getCliArgs())) {
        return content;
    }
    if (fileName.endsWith(".d.ts")) {
        return content;
    }
    if (!context.getSystem().fileExists(fileName)) {
        throw new Error(`${addonName} (${fileName}) could not find source file`);
    }
    const sf = typescript_1.default.createSourceFile(fileName, content, context.getCliArgs().options.target ?? typescript_1.default.ScriptTarget.Latest, true);
    const compilationOptions = context.getProfileConfig();
    if (!compilationOptions) {
        // When profileConfig is missing, return original content without transformation
        // This allows addons to be specified without profiles (they'll just skip transformation)
        return content;
    }
    const transformResults = typescript_1.default.transform(sf, [addonFn(context)], context.getCliArgs().options);
    if (transformResults.diagnostics) {
        transformResults.diagnostics.forEach(it => context.getReporter().reportDiagnostic(it));
    }
    const transformedSf = transformResults.transformed.find(it => it.fileName === sf.fileName);
    // Only print if the AST was actually transformed
    // This prevents ts.createPrinter() from reformatting unchanged files
    if (!transformedSf || transformedSf === sf) {
        return content;
    }
    const printed = typescript_1.default.createPrinter().printFile(transformedSf);
    // Final safety check: if printed content is identical to original, return original
    // This preserves exact formatting when no semantic changes occurred
    return printed === content ? content : printed;
};
exports.createBaseTransformer = createBaseTransformer;
