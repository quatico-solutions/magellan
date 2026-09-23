"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFunctionName = exports.getDecoration = exports.isNodeExported = exports.isTransformable = exports.getDescendantsOfKind = void 0;
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const typescript_1 = __importStar(require("typescript"));
const constants_1 = require("./constants");
const websmith_api_1 = require("@quatico/websmith-api");
/**
 * Gets descendants of a specific kind from a node
 * @param node The node to search
 * @param kind The kind of node to find
 * @returns The first descendant of the specified kind, or undefined
 */
const getDescendantsOfKind = (node, kind) => {
    if (!node || node.kind === kind) {
        return node;
    }
    const descendant = node.forEachChild(child => (0, exports.getDescendantsOfKind)(child, kind));
    return descendant;
};
exports.getDescendantsOfKind = getDescendantsOfKind;
/**
 * Checks if a node is transformable (function declaration or variable statement with arrow function)
 */
const isTransformable = (node) => {
    return (typescript_1.default.isFunctionDeclaration(node) ||
        (typescript_1.default.isVariableStatement(node) && (0, exports.getDescendantsOfKind)(node, typescript_1.SyntaxKind.ArrowFunction) !== undefined));
};
exports.isTransformable = isTransformable;
/**
 * Checks if a node is exported
 */
const isNodeExported = (node) => {
    return (typescript_1.default.getCombinedModifierFlags(node) & typescript_1.default.ModifierFlags.Export) !== 0;
};
exports.isNodeExported = isNodeExported;
/**
 * Extracts comment lines preceding a node from the source file
 */
const getDecoratorCommentLines = (sf, node) => {
    if ((!typescript_1.default.isFunctionDeclaration(node) && !typescript_1.default.isVariableStatement(node)) || node.pos < 0) {
        return [];
    }
    // Get the full text before the node
    const comment = node.getFullText(sf).slice(0, node.getLeadingTriviaWidth(sf));
    // Split the comment into lines and clean
    return comment
        .split("\n")
        .map(line => line.trim())
        .filter(line => !!line);
};
/**
 * Gets decoration data from a service decorator comment
 * @param sf The source file
 * @param node The node with the decorator
 * @param decoratorText The decorator name to search for
 * @returns ServiceDecoratorData if found, undefined otherwise
 */
const getDecoration = (sf, node, decoratorText, context) => {
    const commentLines = getDecoratorCommentLines(sf, node);
    if (commentLines.length === 0) {
        return undefined;
    }
    // Check that the last non-empty comment line contains the decorator
    const decoratorLine = commentLines[commentLines.length - 1];
    if (!decoratorLine.includes(`@${decoratorText}`)) {
        return undefined;
    }
    try {
        // Extract any JSON configuration from the decorator
        const matches = decoratorLine.match(/\/\/.*@service\(({.*})?\)/);
        if (!matches || matches.length === 1 || matches[1] === undefined) {
            return fillDefaultMetaInformation(context);
        }
        return fillDefaultMetaInformation(context, JSON.parse(matches[1]));
    }
    catch (err) {
        const error = err;
        if (error) {
            context.getReporter().reportDiagnostic(new websmith_api_1.ErrorMessage(error.toString()));
        }
    }
    return undefined;
};
exports.getDecoration = getDecoration;
/**
 * Fills in default values for service decorator data
 */
const fillDefaultMetaInformation = (context, decoratorData) => {
    // Validate kind value
    if (decoratorData?.kind && !["local", "external"].includes(decoratorData.kind)) {
        context
            .getReporter()
            .reportDiagnostic(new websmith_api_1.ErrorMessage(`Invalid service kind "${decoratorData?.kind}" provided. Must be empty, "local" or "external"`));
        return undefined;
    }
    // Use default namespace if not provided
    const { namespace = constants_1.DEFAULT_NAMESPACE } = decoratorData ?? {};
    // Default kind is "local"
    return {
        kind: decoratorData?.kind && ["local", "external"].includes(decoratorData?.kind ?? "unknown") ? decoratorData?.kind : "local",
        namespace,
    };
};
/**
 * Gets the name of a function
 */
const getFunctionName = (declaration) => {
    if (typescript_1.default.isVariableDeclaration(declaration) && typescript_1.default.isIdentifier(declaration.name)) {
        return declaration.name.text;
    }
    if (typescript_1.default.isFunctionDeclaration(declaration) && declaration.name) {
        return declaration.name.text;
    }
    throw new Error("getFunctionName failed, no function or arrow function node provided.");
};
exports.getFunctionName = getFunctionName;
