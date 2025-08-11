import { compilationEnv } from "@quatico/websmith-testing";
import path from "node:path";

beforeEach(() => {
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
});

describe("FoobarAddon", () => {
    it("should compile source files", () => {
        const results = compilationEnv("./__TEST__")
            .addAddon("client-function-transform", path.join(__dirname, ".."))
            .addProjectFromSource({
                "bar.ts": `console.log("Hello, Bar!");`,
                "foo.ts": `export class Foo<T> {
                    constructor(public value: T) {
                        console.log("Hello, Foo!", JSON.stringify(value));
                    }
                }`,
            })
            .compile();

        expect(results.getCompiledFiles().getPaths()).toEqual([
            "/__TEST__/dist/bar.js",
            "/__TEST__/dist/bar.d.ts",
            "/__TEST__/dist/foo.js",
            "/__TEST__/dist/foo.d.ts",
        ]);
        expect(results.getCompiledFile("foo.js")?.getContent()).toMatchInlineSnapshot(`
            "export class Foo {
                value;
                constructor(value) {
                    this.value = value;
                    console.log("Hello, Foo!", JSON.stringify(value));
                }
            }
            "
        `);
    });
});
