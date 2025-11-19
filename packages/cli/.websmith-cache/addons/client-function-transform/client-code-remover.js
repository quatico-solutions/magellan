"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientSideCodeRemover = void 0;
const typescript_1 = __importDefault(require("typescript"));
const constants_1 = require("../magellan-shared/constants");
const node_helpers_1 = require("../magellan-shared/node-helpers");
const should_import_be_kept_1 = require("./should-import-be-kept");
/**
 * Creates a visitor function that removes code not needed on the client side
 */
const clientSideCodeRemover = (ctx, sf, context) => {
    return (node) => {
        if (typescript_1.default.isSourceFile(node)) {
            return typescript_1.default.visitEachChild(node, (0, exports.clientSideCodeRemover)(ctx, sf, context), ctx);
        }
        // Keep imports that are actually used and not redundant
        if ((0, should_import_be_kept_1.shouldImportBeKept)(node, sf)) {
            return node;
        }
        // Keep type declarations
        if (typescript_1.default.isTypeAliasDeclaration(node) || typescript_1.default.isInterfaceDeclaration(node) || typescript_1.default.isEnumDeclaration(node)) {
            return node;
        }
        // Keep exported service functions
        if ((0, node_helpers_1.isNodeExported)(node)) {
            const serviceDecoration = (0, node_helpers_1.getDecoration)(sf, node, constants_1.DECORATOR_NAME, context);
            if (serviceDecoration) {
                return node;
            }
        }
        // Remove everything else
        return ctx.factory.createNotEmittedStatement(node);
    };
};
exports.clientSideCodeRemover = clientSideCodeRemover;
