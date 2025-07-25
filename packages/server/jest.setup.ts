/* eslint-disable no-console */
import { createFs, resetFs } from "../../test/fusion-fs";

console.debug = () => undefined;
console.info = () => undefined;
console.log = () => undefined;
console.warn = () => undefined;
console.error = () => undefined;

jest.mock("fs", () => {
    return createFs(jest.requireActual("fs"));
});

afterEach(() => {
    jest.clearAllMocks();
    resetFs();
});
