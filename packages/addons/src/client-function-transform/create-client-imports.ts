import type ts from "typescript";
import { CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME } from "../magellan-shared";
import { REMOTE_INVOKE_PARAM_NAME } from "./transformer-client";
import { createImport } from "./create-import";

/**
 * Creates the necessary import declarations for client functions.
 */
export const createClientImports = (factory: ts.NodeFactory): ts.ImportDeclaration[] => {
    return [
        // import { remoteInvoke } from "@quatico/magellan-client";
        createImport(factory, REMOTE_INVOKE_PARAM_NAME, "@quatico/magellan-client"),
        // import { type Context } from "@quatico/magellan-shared";
        createImport(factory, CONTEXT_TYPE_NAME, "@quatico/magellan-shared", true),
        // import { type Serialization } from "@quatico/magellan-shared";
        createImport(factory, SERIALIZATION_TYPE_NAME, "@quatico/magellan-shared", true),
    ];
};
