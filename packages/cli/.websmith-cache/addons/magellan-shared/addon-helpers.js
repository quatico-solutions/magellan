"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRuntimeLibrary = exports.isTsAddonApplicable = void 0;
const websmith_api_1 = require("@quatico/websmith-api");
const isTsAddonApplicable = (fileName, config) => {
    return config.fileNames.includes(fileName);
};
exports.isTsAddonApplicable = isTsAddonApplicable;
const validateRuntimeLibrary = (libraryName, context) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const runtimeInvoke = require(libraryName);
    if (!runtimeInvoke) {
        context
            .getReporter()
            .reportDiagnostic(new websmith_api_1.ErrorMessage(`${libraryName} missing. Please add it as development dependency to your package.json.`));
    }
    return runtimeInvoke;
};
exports.validateRuntimeLibrary = validateRuntimeLibrary;
