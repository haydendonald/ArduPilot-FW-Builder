import path from "path";
import { Build, Parameter, HWDef } from "./definitions";
import { Process, ProcessEvent } from "./process";
import { Utility } from "./utility";
import * as fs from "fs";
import { Logger } from "./logger"

export interface BuildArguments {
    includeLua?: boolean;
    setParams?: boolean;
    setHWDef?: boolean;
    upload?: boolean;
    resetGit?: boolean;
    connectMAVProxy?: boolean;
}

export class BoardBuilder {
    private buildFor: Build;
    private arguments: BuildArguments;
    private process: Process | undefined;
    private _logger?: Logger;

    constructor(buildFor: Build, args?: BuildArguments) {
        this.buildFor = buildFor;
        this.arguments = args || {};

        //If there is no git repo, set the default to ArduPilot master
        if (this.buildFor.gitRepo === undefined) { this.buildFor.gitRepo = "https://github.com/ArduPilot/ardupilot.git"; }
        if (this.buildFor.gitBranch === undefined) { this.buildFor.gitBranch = "master"; }
    }

    private get logger(): Logger {
        return this._logger || Logger.top;
    }

    private get repoName(): string | undefined {
        if (!this.buildFor.gitRepo) { return undefined; }
        return `${this.buildFor.gitRepo.replace(/[/\\?\/%*:|"<>]/g, '')}:${this.buildFor.gitBranch}`;
    }

    get cloneRepoCommand(): string {
        return `git clone -b ${this.buildFor.gitBranch} ${this.buildFor.gitRepo} ${Utility.repoDirectory}/${this.repoName}`;
    }

    get buildLocation(): string {
        return `${Utility.buildDirectory}/${this.buildFor.board}-${this.buildFor.target}/${this.repoName}`
    }

    static get libDirectory(): string {
        return `${this.}/libraries`
    }

    static get scriptingDirectory(): string {
        return `${Utility.libDirectory}/AP_Scripting/`
    }


    get name(): string {
        return `${this.buildFor.board}-${this.buildFor.target}`;
    }

    setLogger(logger: Logger) { this._logger = logger; }

    /**
     * Download our repo if it doesn't exist
     * @returns A promise
     */
    async downloadRepo() {
        return new Promise<void>((resolve) => {
            if (!fs.existsSync(Utility.repoDirectory)) { fs.mkdirSync(Utility.repoDirectory); }

            //Start by checking if we have already downloaded the repo(s), if not download them
            if (!this.repoName) { resolve(); return; }
            if (fs.existsSync(path.join(Utility.repoDirectory, this.repoName))) {
                this.logger.success(`Repo ${this.buildFor.gitRepo} ${this.buildFor.gitBranch} already exists at ${Utility.repoDirectory}/${this.repoName}`);
                resolve();
                return;
            }
            this.logger.log(`Downloading repo from ${this.buildFor.gitRepo} ${this.buildFor.gitBranch} to ${Utility.repoDirectory}/${this.repoName}`);
            let process = new Process("bash");
            process.on(ProcessEvent.data, (data: any) => { console.log(data.toString()); });
            process.on(ProcessEvent.error, (error: any) => { console.log(error.toString()); });
            process.on(ProcessEvent.close, (code: any) => { console.log(code); resolve(); });
            process?.execute(this.cloneRepoCommand, true);
            this.logger.success(`Repo ${this.buildFor.gitRepo} ${this.buildFor.gitBranch} finished downloading to ${Utility.repoDirectory}/${this.repoName}`);
        });
    }

    /**
     * Copy the repo to the build directory
     */
    async copyRepo() {
        return new Promise<void>((resolve) => {
            if (!fs.existsSync(Utility.buildDirectory)) { fs.mkdirSync(Utility.buildDirectory); }
            this.logger.log(`Copying repo from ${Utility.repoDirectory}/${this.repoName} to ${this.buildLocation}`);
            if (fs.existsSync(this.buildLocation)) { fs.rmSync(this.buildLocation, { recursive: true }); }
            fs.cpSync(`${Utility.repoDirectory}/${this.repoName}`, `${this.buildLocation}`, { recursive: true });
            this.logger.success(`Finished copying repo ${this.buildFor.gitRepo} ${this.buildFor.gitBranch} to ${this.buildLocation}`);
            resolve();
        });
    }

    /**
     * Process the LUA options
     */
    async processLUA() {
        if (!this.buildFor.lua) { return; }
        if (this.buildFor.lua.enableScripting) {
            this.logger.log("Adding SCR_ENABLED=1 to parameter definition");
            this.buildFor.parameter?.append?.push({
                name: "SCR_ENABLED",
                value: "1"
            });
        }
        if (!this.buildFor.lua.include) {
            this.logger.log("Removed the scripting directory as LUA is not included");
            fs.rmSync(`${this.buildFor.board.hwDefDirectory}/scripts`, { recursive: true });
            return;
        }
        if (!fs.existsSync(`${this.buildFor.board.hwDefDirectory}/scripts`)) { fs.mkdirSync(`${this.buildFor.board.hwDefDirectory}/scripts`); }
        if (!this.buildFor.lua.luaFiles) { return; }
        for (let file of this.buildFor.lua.luaFiles) {

            //If it's an array of files generate a LUA file containing all the files
            if (Array.isArray(file.file)) {






            }
            //Otherwise copy the single file in
            else {
                this.logger.log(`Copied ${file.file} to the scripts directory`);
                fs.cpSync(file.file as string, `${this.buildFor.board.hwDefDirectory}/scripts`);
            }


            if (file.validateSyntax) {

            }
        }
    }

    /**
     * Update our build arguments with new ones, only replacing values that are not undefined
     * @param args 
     */
    changeArguments(args: BuildArguments): void {
        this.arguments = {
            ...args,
            ...this.arguments
        }
    }

    async build() {
        this.logger.log(`Begin building!`);
        await this.downloadRepo();
        await this.copyRepo();
        await this.processLUA();


        // //Create our process to work from
        // this.process = new Process("bash");
        // this.process.on(ProcessEvent.data, (data: any) => {
        //     console.log(data.toString());
        // });
        // this.process.on(ProcessEvent.error, (error: any) => {
        //     console.log(error.toString());
        // });
        // this.process.on(ProcessEvent.close, (code: any) => {
        //     console.log(code.toString());
        // });

        // //Destroy our process once done
        // this.process.destroy();
    }
}

export class MultiBuilder {
    private builders: BoardBuilder[];
    private process: Process | undefined;
    private _logger?: Logger;

    private get logger(): Logger {
        return this._logger || Logger.top || new Logger();
    }

    constructor(builders: BoardBuilder[], args?: BuildArguments) {
        this.builders = builders;

        //If we have arguments update the builders with the set arguments
        if (args) {
            this.builders.forEach((builder) => {
                builder.changeArguments(args);
                builder.setLogger(this.logger.addChild({ name: `${builder.name}` }));
            });
        }
    }

    /**
     * Download all the repos we need to build
     * @returns A promise
     */
    private async downloadRepos() {
        //Store a list of repos we need to download
        let downloaders: BoardBuilder[] = [];
        let commands: string[] = [];
        for (let builder of this.builders) {
            if (commands.includes(builder.cloneRepoCommand)) { continue; }
            commands.push(builder.cloneRepoCommand);
            downloaders.push(builder);
        }

        //Ok run through and download them asynchronously
        this.logger.log(`Downloading ${downloaders.length} repo(s) required by ${this.builders.length} builder(s)`);
        await Promise.all(downloaders.map((builder) => builder.downloadRepo()));
    }

    async build() {
        this.logger.log("Begin build!");
        await this.downloadRepos();
        await Promise.all(this.builders.map((builder => {
            return builder.build();
        })));

        //Destroy our process at the end
        this.process?.destroy();
    }
}
