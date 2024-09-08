import chalk, { Chalk } from 'chalk';

export interface LoggerOptions {
    name: string,
    forceTop?: boolean,
    alwaysOutput?: boolean
}

export class Logger {
    static top: Logger;

    private options: LoggerOptions;
    private children: Logger[] = [];
    private parent?: Logger;

    constructor(options?: LoggerOptions) {
        this.options = options || {
            name: "main"
        };
        this.options.name = this.options.name.toLowerCase();
        if (!Logger.top || this.options.forceTop) { Logger.top = this; }
    }

    private outputConsole(type: string, message: string, name?: string[], modifier?: (raw: string) => string) {
        if (!name) { name = [...name || [], this.options.name]; }
        if (!modifier) { modifier = (raw: string) => raw }
        if (this.parent) {
            this.parent.outputConsole(type, message, name, modifier);
            if (!this.options.alwaysOutput) { return; }
        }
        let date = new Date();
        let dateString = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
        console.log(modifier(`[${type}][${name.join("/")}][${dateString}] ${message}`));
    }

    log(message: string, name?: string[]) {
        this.outputConsole("info", message, name, (raw: string) => chalk.blueBright(raw));
    }

    error(message: string, name?: string[]) {
        this.outputConsole("error", message, name, (raw: string) => chalk.redBright(raw));
    }

    warn(message: string, name?: string[]) {
        this.outputConsole("warn", message, name, (raw: string) => chalk.yellowBright(raw));
    }

    success(message: string, name?: string[]) {
        this.outputConsole("info", message, name, (raw: string) => chalk.greenBright(raw));
    }

    debug(message: string, name?: string[]) {
        this.outputConsole("debug", message, name, (raw: string) => chalk.gray(raw));
    }

    addChild(options: LoggerOptions) {
        this.children.push(new Logger(options));
        this.children[this.children.length - 1].parent = this;
        return this.children[this.children.length - 1];
    }
}