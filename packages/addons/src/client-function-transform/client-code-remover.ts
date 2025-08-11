import { type AddonContext } from "@quatico/websmith-api";
import ts from "typescript";
import { DECORATOR_NAME } from "../magellan-shared/constants";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { getDecoration, isNodeExported } from "../magellan-shared/node-helpers";
import { shouldImportBeKept } from "./should-import-be-kept";

/**
 * Creates a visitor function that removes code not needed on the client side
 */
export const clientSideCodeRemover = (ctx: ts.TransformationContext, sf: ts.SourceFile, context: AddonContext<MagellanConfig>) => {
    return (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isSourceFile(node)) {
            return ts.visitEachChild(node, clientSideCodeRemover(ctx, sf, context), ctx);
        }

        // Keep imports that are actually used and not redundant
        if (shouldImportBeKept(node, sf)) {
            return node;
        }

        // Keep type declarations
        if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
            return node;
        }

        // Keep exported service functions
        if (isNodeExported(node)) {
            const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME, context);
            if (serviceDecoration) {
                return node;
            }
        }

        // Remove everything else
        return ctx.factory.createNotEmittedStatement(node);
    };
};
