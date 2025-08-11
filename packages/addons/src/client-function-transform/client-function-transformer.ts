import type { AddonContext } from "@quatico/websmith-api";
import ts from "typescript";
import { type MagellanConfig, getDecoration, DECORATOR_NAME, validateServiceFunctionSignature, DEFAULT_NAMESPACE } from "../magellan-shared";
import { transformClientFunction } from "./transform-client-function";

/**
 * Creates a visitor function that transforms service functions into client invocations.
 */
export const clientFunctionTransformer = (ctx: ts.TransformationContext, sf: ts.SourceFile, context: AddonContext<MagellanConfig>): ts.Visitor => {
    return (node: ts.Node): ts.VisitResult<ts.Node> => {
        const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME, context);
        if (!serviceDecoration) {
            return ts.visitEachChild(node, clientFunctionTransformer(ctx, sf, context), ctx);
        }

        // Transform arrow function to client invocation
        if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
                validateServiceFunctionSignature(declaration.initializer.parameters);
                return transformClientFunction(
                    ctx.factory,
                    node,
                    declaration,
                    declaration.initializer,
                    serviceDecoration?.namespace || DEFAULT_NAMESPACE,
                    context
                );
            }
            return node;
        }

        // Transform function declaration to client invocation
        if (ts.isFunctionDeclaration(node) && node.name) {
            validateServiceFunctionSignature(node.parameters);
            return transformClientFunction(ctx.factory, node, node, node, serviceDecoration?.namespace || DEFAULT_NAMESPACE, context);
        }
        return node;
    };
};
