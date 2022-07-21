/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
export const assert = (condition: boolean, message: string): void | never => {
    if (!condition) {
        throw new Error(message);
    }
};
