import { Writable } from "stream";

export class TerminalStream extends Writable {
    public write(line: string) {
        // eslint-disable-next-line no-console
        console.info("Logger:: ", line);
        return true;
    }
}