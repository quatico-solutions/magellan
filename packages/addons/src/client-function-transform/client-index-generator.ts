/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext, type ResultProcessor } from "@quatico/websmith-api";
import path from "path";
import ts from "typescript";

/**
 * Information about an exported service function.
 */
interface ExportedFunction {
    name: string;
    filePath: string;
    relativePath: string;
    typeSignature: string;
}

/**
 * Creates a ResultProcessor that generates index.js and index.d.ts files
 * with re-exports of all transformed client proxy functions.
 */
export const createClientIndexGenerator = (): ResultProcessor => {
    return (emittedFiles: string[], ctx: AddonContext): void => {
        const system = ctx.getSystem();
        const compilerOptions = ctx.getCompilerOptions();
        const outDir = compilerOptions.outDir;

        if (!outDir) {
            return; // No output directory specified
        }

        // Filter to only .js files (not .d.ts, .map, etc.)
        const jsFiles = emittedFiles.filter(f => f.endsWith(".js") && !f.endsWith("index.js"));

        if (jsFiles.length === 0) {
            return; // No files to index
        }

        // Extract exported functions from each file
        const exportedFunctions: ExportedFunction[] = [];

        for (const jsFilePath of jsFiles) {
            const content = system.readFile(jsFilePath);
            if (!content) {
                continue;
            }

            // Parse the JS file to find exports
            const functions = extractExportedFunctions(jsFilePath, content, outDir);
            exportedFunctions.push(...functions);
        }

        if (exportedFunctions.length === 0) {
            return; // No functions to export
        }

        // Generate index.js
        const indexJs = generateIndexJs(exportedFunctions);
        const indexJsPath = path.join(outDir, "index.js");
        system.writeFile(indexJsPath, indexJs);

        // Generate index.d.ts
        const indexDts = generateIndexDts(exportedFunctions);
        const indexDtsPath = path.join(outDir, "index.d.ts");
        system.writeFile(indexDtsPath, indexDts);
    };
};

/**
 * Extracts exported function names from a JavaScript file.
 */
const extractExportedFunctions = (filePath: string, content: string, outDir: string): ExportedFunction[] => {
    const functions: ExportedFunction[] = [];
    const relativePath = "./" + path.relative(outDir, filePath).replace(/\.js$/, "").replace(/\\/g, "/");

    // Parse as JavaScript module
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

    ts.forEachChild(sourceFile, node => {
        // Handle: export const functionName = ...
        if (ts.isVariableStatement(node) && hasExportModifier(node)) {
            for (const declaration of node.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name)) {
                    const name = declaration.name.text;
                    // Check if it's a function (arrow function or function expression)
                    if (declaration.initializer && isAsyncFunction(declaration.initializer)) {
                        functions.push({
                            name,
                            filePath,
                            relativePath,
                            typeSignature: extractTypeSignature(declaration),
                        });
                    }
                }
            }
        }

        // Handle: export async function functionName() { ... }
        if (ts.isFunctionDeclaration(node) && hasExportModifier(node) && node.name) {
            functions.push({
                name: node.name.text,
                filePath,
                relativePath,
                typeSignature: extractFunctionTypeSignature(node),
            });
        }
    });

    return functions;
};

/**
 * Checks if a node has the export modifier.
 */
const hasExportModifier = (node: ts.Node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
};

/**
 * Checks if an expression is an async function.
 */
const isAsyncFunction = (node: ts.Expression): boolean => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
        return modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
    }
    return false;
};

/**
 * Extracts type signature from a variable declaration.
 * For now, returns a generic async function type.
 */
const extractTypeSignature = (_declaration: ts.VariableDeclaration): string => {
    // Default to a generic async function type
    // In a full implementation, we would parse the original .ts file for proper types
    return "(...args: unknown[]) => Promise<unknown>";
};

/**
 * Extracts type signature from a function declaration.
 */
const extractFunctionTypeSignature = (_node: ts.FunctionDeclaration): string => {
    // Default to a generic async function type
    return "(...args: unknown[]) => Promise<unknown>";
};

/**
 * Generates the index.js file content with re-exports.
 */
const generateIndexJs = (functions: ExportedFunction[]): string => {
    // Group functions by file
    const fileGroups = new Map<string, string[]>();

    for (const func of functions) {
        const existing = fileGroups.get(func.relativePath) || [];
        existing.push(func.name);
        fileGroups.set(func.relativePath, existing);
    }

    // Generate export statements
    const lines: string[] = ["/*", " * Auto-generated index file for client proxy functions.", " * Do not edit manually.", " */", ""];

    for (const [relativePath, names] of fileGroups) {
        lines.push(`export { ${names.join(", ")} } from "${relativePath}";`);
    }

    lines.push(""); // Trailing newline
    return lines.join("\n");
};

/**
 * Generates the index.d.ts file content with type declarations.
 */
const generateIndexDts = (functions: ExportedFunction[]): string => {
    // Group functions by file
    const fileGroups = new Map<string, string[]>();

    for (const func of functions) {
        const existing = fileGroups.get(func.relativePath) || [];
        existing.push(func.name);
        fileGroups.set(func.relativePath, existing);
    }

    // Generate type re-exports
    const lines: string[] = ["/*", " * Auto-generated type declarations for client proxy functions.", " * Do not edit manually.", " */", ""];

    for (const [relativePath, names] of fileGroups) {
        lines.push(`export { ${names.join(", ")} } from "${relativePath}";`);
    }

    lines.push(""); // Trailing newline
    return lines.join("\n");
};
