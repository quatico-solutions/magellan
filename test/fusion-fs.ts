/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import fs, { MakeDirectoryOptions, ObjectEncodingOptions, PathLike, PathOrFileDescriptor, Stats, WatchFileOptions } from "fs";
import { createFsFromVolume, vol } from "memfs";
import Dirent from "memfs/lib/Dirent";
import { TDataOut } from "memfs/lib/encoding";
import { IReaddirOptions, IReadStream, IReadStreamOptions, IWatchOptions, StatWatcher, TCallback } from "memfs/lib/volume";
import { dirname } from "path";

export const createFs = (actualFs: typeof fs): typeof fs => {
    const memfs = createFsFromVolume(vol);

    return {
        ...actualFs,
        readlink: (
            path: PathLike,
            options: fs.BufferEncodingOption,
            callback: (err: NodeJS.ErrnoException | null, linkString: Buffer) => void
        ): void => {
            return memfs.existsSync(path) ? memfs.readlink(path, options as any, callback as any) : actualFs.readlink(path, options, callback);
        },
        readlinkSync: (path: PathLike, options?: fs.EncodingOption): string | Buffer => {
            return memfs.existsSync(path) ? memfs.readlinkSync(path, options as any) : actualFs.readlinkSync(path, options);
        },
        read: <TBuffer extends NodeJS.ArrayBufferView>(
            fd: number,
            buffer: TBuffer,
            offset: number,
            length: number,
            position: fs.ReadPosition | null,
            callback: (err: NodeJS.ErrnoException | null, bytesRead: number, buffer: TBuffer) => void
        ): void => {
            return memfs.fstatSync(fd)
                ? memfs.read(fd, buffer as any, offset, length, position as any, callback as any)
                : actualFs.read(fd, buffer, offset, length, position, callback);
        },
        // readSync: (fd: number, buffer: NodeJS.ArrayBufferView, opts?: ReadSyncOptions): number => {
        readSync: (fd: number, buffer: NodeJS.ArrayBufferView, offset: number, length: number, position: fs.ReadPosition | null): number => {
            return memfs.fstatSync(fd)
                ? memfs.readSync(fd, buffer as any, offset, length, position as any)
                : actualFs.readSync(fd, buffer, offset, length, position);
        },
        readFile: (
            path: PathLike,
            options: IReaddirOptions | string,
            callback: (err: NodeJS.ErrnoException | null, data: Buffer | string) => void
        ): void => {
            options = options ?? { encoding: "utf-8" };
            return memfs.existsSync(path) ? memfs.readFile(path, options, callback as any) : actualFs.readFile(path, options as any, callback);
        },
        readFileSync: (
            path: PathOrFileDescriptor,
            options?: BufferEncoding | (ObjectEncodingOptions & { flag?: string | undefined }) | null | undefined
        ): string | Buffer => {
            try {
                const content = memfs.readFileSync(path, options as any);
                if (content) {
                    return content;
                }
            } catch (err) {
                // falls through
            }
            return actualFs.readFileSync(path, options);
        },
        copyFileSync: (src: PathLike, dest: PathLike, mode?: number): void => {
            if (memfs.existsSync(src)) {
                memfs.copyFileSync(src, dest, mode);
            } else {
                const file = actualFs.readFileSync(src);
                memfs.writeFileSync(dest, file);
            }
        },
        readdir: (path: PathLike, options: IReaddirOptions | string, callback: (err: NodeJS.ErrnoException | null, files: string[]) => void): any => {
            options = options ?? { encoding: "utf-8" };
            return memfs.existsSync(path) ? memfs.readdir(path, options, callback as any) : actualFs.readdir(path, options as any, callback);
        },
        readdirSync: (
            path: PathLike,
            options?:
                | {
                      encoding: BufferEncoding | null;
                      withFileTypes?: false | undefined;
                  }
                | BufferEncoding
                | null
        ): TDataOut[] | Buffer[] | Dirent[] | string[] => {
            options = options ?? { encoding: "utf-8" };
            return memfs.existsSync(path) ? memfs.readdirSync(path, options as any) : actualFs.readdirSync(path, options);
        },
        writeFile: memfs.writeFile,
        writeFileSync: (file: PathOrFileDescriptor, data: any, options?: any): void => {
            const parent = dirname(file.toString());
            if (!memfs.existsSync(parent)) {
                memfs.mkdirSync(parent, { recursive: true });
            }
            memfs.writeFileSync(file, data, options ?? { encoding: "utf-8" });
        },
        writeSync: memfs.writeSync,
        write: memfs.write,
        mkdir: memfs.mkdir,
        mkdirSync: (
            path: PathLike,
            options: MakeDirectoryOptions & {
                recursive: true;
            }
        ): void => memfs.mkdirSync(path, options ?? { recursive: true }),
        mkdirp: memfs.mkdirp,
        mkdirpSync: memfs.mkdirpSync,
        exists: (path: PathLike, callback: (exists: boolean) => void): void =>
            memfs.existsSync(path) ? memfs.exists(path, callback as any) : actualFs.exists(path, callback),
        existsSync: (path: PathLike): boolean => memfs.existsSync(path) || actualFs.existsSync(path),
        lstat: memfs.lstat,
        lstatSync: (path: PathLike): Stats => (memfs.existsSync(path) ? memfs.lstatSync(path) : actualFs.lstatSync(path)),
        fstat: memfs.fstat,
        fstatSync: memfs.fstatSync,
        stat: (path: PathLike, callback: TCallback<Stats>): void =>
            memfs.existsSync(path) ? memfs.stat(path, callback as any) : actualFs.stat(path, callback),
        statSync: (path: PathLike): Stats => (memfs.existsSync(path) ? memfs.statSync(path) : actualFs.statSync(path)),
        createReadStream: (path: PathLike, options?: BufferEncoding | IReadStreamOptions): IReadStream | fs.ReadStream =>
            memfs.existsSync(path) ? memfs.createReadStream(path, options) : actualFs.createReadStream(path, options as any),
        unlinkSync: memfs.unlinkSync,
        realpathSync: (path: PathLike, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): string | TDataOut | Buffer =>
            memfs.existsSync(path) ? memfs.realpathSync(path, options as any) : actualFs.realpathSync(path, options),
        openSync: (path: PathLike, flags: string | number, mode?: string | number): number => {
            if (!memfs.existsSync(path) && actualFs.existsSync(path)) {
                memfs.writeFileSync(path, actualFs.readFileSync(path));
            } else {
                memfs.mkdirSync(dirname(path.toString()), { recursive: true });
                memfs.writeFileSync(path, "");
            }
            return memfs.openSync(path, flags, mode);
        },
        closeSync: memfs.closeSync,
        watch: (path: PathLike, options?: IWatchOptions | string, listener?: (eventType: string, filename: string) => void): fs.FSWatcher =>
            memfs.existsSync(path) ? memfs.watch(path, options, listener) : actualFs.watch(path, options as any, listener),
        watchFile: (
            path: PathLike,
            options:
                | (WatchFileOptions & {
                      bigint: true;
                  })
                | undefined,
            listener: (curr: Stats, prev: Stats) => void
        ): StatWatcher =>
            memfs.existsSync(path)
                ? (memfs.watchFile(path, options as any, listener as any) as any)
                : actualFs.watchFile(path, options as any, listener),
        unwatchFile: (path: PathLike, listener?: (curr: Stats, prev: Stats) => void): void =>
            memfs.existsSync(path) ? memfs.unwatchFile(path, listener as any) : actualFs.unwatchFile(path, listener),
    } as any;
};

export const resetFs = (): void => {
    vol.reset();
};
