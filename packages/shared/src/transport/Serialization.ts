/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
export interface Serialization {
    deserialize: <O>(json: string) => O;
    serialize: <I>(input: I) => string;
}
