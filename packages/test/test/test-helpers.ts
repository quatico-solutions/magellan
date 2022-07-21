/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import fs from "fs";
import path from "path";
import ts, { CompilerHost, CompilerOptions, ModuleKind, ScriptTarget } from "typescript";

export interface TestSourceFile {
    fileName: string;
    sourceCode: string;
}

export const sourcePath = (fileName: string): string => {
    if (!fileName.endsWith(".ts")) {
        fileName += ".ts";
    }
    return path.join(__dirname, "__data__", fileName);
};

export const source = (fileName: string): string => fs.readFileSync(sourcePath(fileName), { encoding: "utf-8" }).toString();

export const createProgram = (options: CompilerOptions | undefined, sourceFiles: TestSourceFile[]): ts.Program => {
    if (!options) {
        options = { target: ScriptTarget.Latest, module: ModuleKind.ESNext, removeComments: true };
    }

    sourceFiles.forEach(sf => fs.writeFileSync(sf.fileName, sf.sourceCode));
    const host = ts.createCompilerHost(options);
    sourceFiles.forEach(sf => ts.createSourceFile(sf.fileName, sf.sourceCode, options?.target ?? ScriptTarget.Latest), true);

    const program = ts.createProgram({
        options: options,
        rootNames: sourceFiles.map(sf => sf.fileName),
        host: { ...host, ...createMemCompilerHost(options, host) },
    });

    return program;
};

const createMemCompilerHost = (options: CompilerOptions, host?: CompilerHost) => {
    if (!host) {
        if (!options) {
            options = { target: ScriptTarget.Latest, module: ModuleKind.ESNext, removeComments: true };
        }
        host = ts.createCompilerHost(options);
    }

    return {
        ...host,
        writeFile: (fileName: string, data: string) => {
            fs.writeFileSync(fileName, data);
        },
        getSourceFile: (fileName: string) => {
            if (fileName === ts.getDefaultLibFileName(options)) {
                fileName = ts.getDefaultLibFilePath(options);
            }
            const content = fs.readFileSync(fileName).toString();
            return ts.createSourceFile(fileName, content, options.target ?? ScriptTarget.Latest);
        },
        getDefaultLibFileName: (options: CompilerOptions) => ts.getDefaultLibFileName(options),
        getDefaultLibLocation: () => path.dirname(ts.getDefaultLibFilePath(options)),
    };
};
