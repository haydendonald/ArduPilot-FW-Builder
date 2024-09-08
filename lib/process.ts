import * as ChildProcess from "child_process";
import EventEmitter from "events";

export class ProcessEvent {
    static data = "data";
    static error = "error";
    static close = "close";
}

export class Process extends EventEmitter {
    process: ChildProcess.ChildProcess;

    /**
     * Create a new process. See https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
     * @param command The command to spawn
     * @param args The arguments for the command
     */
    constructor(command: string, args?: readonly string[], startDirectory?: string) {
        super();

        //Using the spawn method
        this.process = ChildProcess.spawn(command, args);
        this.process.stdout?.on("data", (data: any) => {
            this.emit(ProcessEvent.data, data);
        });
        this.process.stderr?.on("data", (error: any) => {
            this.emit(ProcessEvent.error, error);
        });
        //When the process is closed
        this.process.on("close", (code: string) => {
            this.emit(ProcessEvent.close, code);
        });

        //Make sure we will the process on exit
        process.on("exit", () => { this.destroy(); });
        process.on('SIGINT', () => { this.destroy(); });
        process.on("uncaughtException", () => { this.destroy(); });

        //Change directory into the requested directory
        if (startDirectory) {
            this.execute(`cd ${startDirectory}`);
        }
    }

    /**
     * Kill the process
     */
    kill(): boolean {
        return this.process?.kill();
    }

    /**
     * Destroy the process removing all listeners
     */
    destroy(): boolean {
        if (!this.kill()) { return false; }
        if (this.process) {
            if (this.process.stdout) { this.process.stdout.removeAllListeners(); }
            if (this.process.stderr) { this.process.stderr.removeAllListeners(); }
            process.removeAllListeners();
            return true;
        }
        return false;
    }

    /**
     * Send data to the process
     * @param data The data to write
     * @returns If the write was successful
     */
    send(data: any): boolean {
        if (!this.process) { return false; }
        return this.process.stdin?.write(data) || false;
    }

    /**
     * Execute a command
     * @param command The command to execute
     * @returns If the execution was successful
     */
    execute(command: string, exitAfter: boolean = false): boolean {
        return this.send(command + (exitAfter == true ? ";exit" : "") + "\n");
    }

    /**
     * Exit bash
     * @returns If the exit was successful
     */
    exit() {
        return this.execute("exit");
    }
}