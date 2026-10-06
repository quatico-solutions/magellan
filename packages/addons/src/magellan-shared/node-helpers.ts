/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts, { SyntaxKind } from "typescript";
import { DEFAULT_NAMESPACE } from "./constants";
import { type AddonContext, ErrorMessage } from "@quatico/websmith-api";
import { type MagellanConfig } from "./magellan-config";

/**
 * Configuration data for the @service decorator
 */
export interface ServiceDecoratorData {
    kind: "local" | "external";
    namespace: string;
}

/**
 * Gets descendants of a specific kind from a node
 * @param node The node to search
 * @param kind The kind of node to find
 * @returns The first descendant of the specified kind, or undefined
 */
export const getDescendantsOfKind = <O extends ts.Node>(node: ts.Node, kind: SyntaxKind): O | undefined => {
    if (!node || node.kind === kind) {
        return node as O;
    }
    const descendant = node.forEachChild(child => getDescendantsOfKind<O>(child, kind));
    return descendant as O;
};

/**
 * Checks if a node is transformable (function declaration or variable statement with arrow function)
 */
export const isTransformable = (node: ts.Node): node is ts.VariableStatement | ts.FunctionDeclaration => {
    return (
        ts.isFunctionDeclaration(node) ||
        (ts.isVariableStatement(node) && getDescendantsOfKind<ts.ArrowFunction>(node, SyntaxKind.ArrowFunction) !== undefined)
    );
};

/**
 * Checks if a node is exported
 */
export const isNodeExported = (node: ts.Node): boolean => {
    return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
};

/**
 * Extracts comment lines preceding a node from the source file
 */
const getDecoratorCommentLines = (sf: ts.SourceFile, node: ts.Node): string[] => {
    if ((!ts.isFunctionDeclaration(node) && !ts.isVariableStatement(node)) || node.pos < 0) {
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
export const getDecoration = (
    sf: ts.SourceFile,
    node: ts.Node,
    decoratorText: string,
    context: AddonContext<MagellanConfig>
): ServiceDecoratorData | undefined => {
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
    } catch (err) {
        const error: Error = err as Error;
        if (error) {
            context.getReporter().reportDiagnostic(new ErrorMessage(error.toString()));
        }
    }

    return undefined;
};

/**
 * Fills in default values for service decorator data
 */
const fillDefaultMetaInformation = (
    context: AddonContext<MagellanConfig>,
    decoratorData?: ServiceDecoratorData
): ServiceDecoratorData | undefined => {
    // Validate kind value
    if (decoratorData?.kind && !["local", "external"].includes(decoratorData.kind)) {
        context
            .getReporter()
            .reportDiagnostic(new ErrorMessage(`Invalid service kind "${decoratorData?.kind}" provided. Must be empty, "local" or "external"`));
        return undefined;
    }

    // Use default namespace if not provided
    const { namespace = DEFAULT_NAMESPACE } = decoratorData ?? {};

    // Default kind is "local"
    return {
        kind: decoratorData?.kind && ["local", "external"].includes(decoratorData?.kind ?? "unknown") ? decoratorData?.kind : "local",
        namespace,
    };
};

/**
 * Gets the name of a function
 */
export const getFunctionName = (declaration: ts.VariableDeclaration | ts.FunctionDeclaration): string => {
    if (ts.isVariableDeclaration(declaration) && ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
    }
    if (ts.isFunctionDeclaration(declaration) && declaration.name) {
        return declaration.name.text;
    }
    throw new Error("getFunctionName failed, no function or arrow function node provided.");
};
