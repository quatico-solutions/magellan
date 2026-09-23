"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientIndexGenerator = void 0;
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
/**
 * Creates a ResultProcessor that generates index.js and index.d.ts files
 * with re-exports of all transformed client proxy functions.
 */
const createClientIndexGenerator = () => {
    return (emittedFiles, ctx) => {
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
        const exportedFunctions = [];
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
        const indexJsPath = path_1.default.join(outDir, "index.js");
        system.writeFile(indexJsPath, indexJs);
        // Generate index.d.ts
        const indexDts = generateIndexDts(exportedFunctions);
        const indexDtsPath = path_1.default.join(outDir, "index.d.ts");
        system.writeFile(indexDtsPath, indexDts);
    };
};
exports.createClientIndexGenerator = createClientIndexGenerator;
/**
 * Extracts exported function names from a JavaScript file.
 */
const extractExportedFunctions = (filePath, content, outDir) => {
    const functions = [];
    const relativePath = "./" + path_1.default.relative(outDir, filePath).replace(/\.js$/, "").replace(/\\/g, "/");
    // Parse as JavaScript module
    const sourceFile = typescript_1.default.createSourceFile(filePath, content, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.JS);
    typescript_1.default.forEachChild(sourceFile, node => {
        // Handle: export const functionName = ...
        if (typescript_1.default.isVariableStatement(node) && hasExportModifier(node)) {
            for (const declaration of node.declarationList.declarations) {
                if (typescript_1.default.isIdentifier(declaration.name)) {
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
        if (typescript_1.default.isFunctionDeclaration(node) && hasExportModifier(node) && node.name) {
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
const hasExportModifier = (node) => {
    const modifiers = typescript_1.default.canHaveModifiers(node) ? typescript_1.default.getModifiers(node) : undefined;
    return modifiers?.some(m => m.kind === typescript_1.default.SyntaxKind.ExportKeyword) ?? false;
};
/**
 * Checks if an expression is an async function.
 */
const isAsyncFunction = (node) => {
    if (typescript_1.default.isArrowFunction(node) || typescript_1.default.isFunctionExpression(node)) {
        const modifiers = typescript_1.default.canHaveModifiers(node) ? typescript_1.default.getModifiers(node) : undefined;
        return modifiers?.some(m => m.kind === typescript_1.default.SyntaxKind.AsyncKeyword) ?? false;
    }
    return false;
};
/**
 * Extracts type signature from a variable declaration.
 * For now, returns a generic async function type.
 */
const extractTypeSignature = (_declaration) => {
    // Default to a generic async function type
    // In a full implementation, we would parse the original .ts file for proper types
    return "(...args: unknown[]) => Promise<unknown>";
};
/**
 * Extracts type signature from a function declaration.
 */
const extractFunctionTypeSignature = (_node) => {
    // Default to a generic async function type
    return "(...args: unknown[]) => Promise<unknown>";
};
/**
 * Generates the index.js file content with re-exports.
 */
const generateIndexJs = (functions) => {
    // Group functions by file
    const fileGroups = new Map();
    for (const func of functions) {
        const existing = fileGroups.get(func.relativePath) || [];
        existing.push(func.name);
        fileGroups.set(func.relativePath, existing);
    }
    // Generate export statements
    const lines = ["/*", " * Auto-generated index file for client proxy functions.", " * Do not edit manually.", " */", ""];
    for (const [relativePath, names] of fileGroups) {
        lines.push(`export { ${names.join(", ")} } from "${relativePath}";`);
    }
    lines.push(""); // Trailing newline
    return lines.join("\n");
};
/**
 * Generates the index.d.ts file content with type declarations.
 */
const generateIndexDts = (functions) => {
    // Group functions by file
    const fileGroups = new Map();
    for (const func of functions) {
        const existing = fileGroups.get(func.relativePath) || [];
        existing.push(func.name);
        fileGroups.set(func.relativePath, existing);
    }
    // Generate type re-exports
    const lines = ["/*", " * Auto-generated type declarations for client proxy functions.", " * Do not edit manually.", " */", ""];
    for (const [relativePath, names] of fileGroups) {
        lines.push(`export { ${names.join(", ")} } from "${relativePath}";`);
    }
    lines.push(""); // Trailing newline
    return lines.join("\n");
};
