import path from "path";
import { Build } from "./definitions";
import { Process, ProcessEvent } from "./process";
import { Utility } from "./utility";
import * as fs from "fs";
import { Logger } from "./logger"
import * as luaparser from "luaparse";

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
    buildError?: string;

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

    get name(): string {
        return `${this.buildFor.board.friendlyName}-${this.buildFor.target}`;
    }

    get cloneRepoCommand(): string {
        return `git clone -b ${this.buildFor.gitBranch} ${this.buildFor.gitRepo} ${Utility.repoDirectory}/${this.repoName}`;
    }

    get buildLocation(): string {
        return `${Utility.buildDirectory}/${this.name}/${this.repoName}`;
    }

    get libDirectory(): string {
        return `${this.buildLocation}/libraries`;
    }

    get hwDefDirectory(): string {
        return `${this.buildLocation}${this.buildFor.board.hwDefDirectory}`;
    }

    get hwDefFile(): string {
        return `${this.hwDefDirectory}/hwdef.dat`;
    }

    get paramDefaultsFile(): string {
        return `${this.hwDefDirectory}/defaults.parm`;
    }

    /**
     * The directories for scripting
     * @param libDirectory The location of the AP_Scripting library
     * @param bindingsFile The location of the bindings.desc file
     * @param scriptingDirectory The location of the scripts folder in the board hwdef directory
     */
    get scriptingDirectories(): {
        libDirectory: string,
        bindingsFile: string,
        scriptingDirectory: string
    } {
        const libDirectory = `${this.libDirectory}/AP_Scripting`;
        return {
            libDirectory,
            bindingsFile: `${libDirectory}/generator/bindings.desc`,
            scriptingDirectory: `${this.hwDefDirectory}/scripts`
        }
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
     * Process any git changes
     */
    async processGit() {
        if (!this.buildFor.git) { return; }
        const git = this.buildFor.git;
        const process = new Process("bash", undefined, this.buildLocation);
        return new Promise<void>((resolve) => {
            this.logger.log(`Processing GIT changes`);
            process.on(ProcessEvent.data, (data: any) => { this.logger.debug(data.toString()); });
            process.on(ProcessEvent.error, (error: any) => { this.logger.error(error.toString()); });
            process.on(ProcessEvent.close, (code: any) => { this.logger.debug(`Process exited with ${code}`); resolve(); });

            //Reset git
            if (git.reset) {
                process?.execute(`git reset --hard`);
            }

            process?.exit();
        });
    }

    /**
     * Process the LUA options
     */
    async processLUA() {
        if (!this.buildFor.lua) { return; }
        const directories = this.scriptingDirectories;
        //If scripting is enabled add the SCR_ENABLED parameter to defaults to enable it
        if (this.buildFor.lua.enableScripting) {
            this.logger.log("Adding SCR_ENABLED=1 to parameter definition");
            if (!this.buildFor.parameter) { this.buildFor.parameter = {}; }
            if (!this.buildFor.parameter.append) { this.buildFor.parameter.append = {}; }
            this.buildFor.parameter.append["SCR_ENABLED"] = "1";
        }

        //If LUA is not included in this build remove the scripting directory from the board
        if (!this.buildFor.lua.include) {
            this.logger.log("Removed the scripting directory as LUA is not included");
            fs.rmSync(directories.scriptingDirectory, { recursive: true });
            return;
        }
        if (!this.buildFor.lua.luaFiles) { return; }

        //Make the scripting directory from the board if it doesn't already exist
        if (!fs.existsSync(`${directories.scriptingDirectory}`)) { fs.mkdirSync(`${directories.scriptingDirectory}`); }

        //Add our LUA files
        for (const fileIndex in this.buildFor.lua.luaFiles) {
            const file = this.buildFor.lua.luaFiles[fileIndex];
            const fileName = file.outputName || (Array.isArray(file.file) ? `output_${fileIndex}.lua` : file.file as string);
            const outputLocation = `${directories.scriptingDirectory}/${fileName}`;
            const writeStream: fs.WriteStream = fs.createWriteStream(outputLocation)

            //Make a singular file an array containing just the file
            if (!Array.isArray(file.file)) { file.file = [file.file as string]; }

            //Inject into the file
            const inject = (comment: string, data: Buffer): Promise<void> => {
                const header: Buffer = Buffer.from(`--- ${comment}\n`);
                const end: Buffer = Buffer.from("\n");
                return new Promise<void>((resolve, reject) => { writeStream.write(Buffer.concat([header, data, end]), (error) => { if (error) { reject(error); } else { resolve() } }); });
            }

            //Inject the helper functions at the top of the file
            if (file.helperFunctions) {
                for (const i in file.helperFunctions) {
                    await inject(`Helper ${i}`, Buffer.from(file.helperFunctions[i]));
                }
            }

            //Go through the file(s) and append add them to the output
            for (const currentFile of file.file) {
                await inject(`File ${currentFile}`, fs.readFileSync(currentFile));
            }

            //Ok! Done :)
            writeStream.close();

            //Validate the LUA syntax to check for basic problems before we send it to the board
            if (file.validateSyntax) {
                const data: Buffer = fs.readFileSync(outputLocation);
                try { const result = await luaparser.parse(data.toString()); }
                catch (e) {
                    this.logger.error(`LUA validation error! ${e}. Will not continue with build`);
                    throw e;
                }
            }
        }
    }

    /**
     * Process the HWDef file adding information that's required
     */
    async processHWDef() {
        const hwDef = this.buildFor.hwDef;

        if (!hwDef) { return; }
        this.logger.log(`Processing HWDef file`);

        //Should we remove everything in the HWDef file
        if (hwDef.clear == true || hwDef.replaceFile) {
            this.logger.debug(`Removing file ${this.hwDefFile}`);
            if (fs.existsSync(this.hwDefFile)) { fs.unlinkSync(this.hwDefFile); }
            this.logger.debug(`Removed the HWDef file`);
        }

        //Copy the desired hw def file into the directory
        if (hwDef.replaceFile) {
            this.logger.debug(`Copied ${hwDef.replaceFile} to ${this.hwDefFile}`);
            fs.copyFileSync(hwDef.replaceFile, this.hwDefFile);
        }

        //Append any HWDef values
        if (hwDef.append) {
            fs.appendFileSync(this.hwDefFile, Buffer.from(`\n`));
            for (let line of hwDef.append) {
                this.logger.debug(`Adding "${line}" to the HWDef file`);
                fs.appendFileSync(this.hwDefFile, Buffer.from(`${line}\n`));
            }
        }
    }

    /**
     * Process the parameters file adding information that's required
     */
    async processParameters() {
        const params = this.buildFor.parameter;
        if (!params) { return; }
        this.logger.log(`Processing the parameters`);;

        //Should we remove everything in the HWDef file
        if (params.clear == true || params.replaceFile) {
            this.logger.debug(`Removing file ${this.paramDefaultsFile}`);
            if (fs.existsSync(this.hwDefFile)) { fs.unlinkSync(this.paramDefaultsFile); }
        }

        //Copy the desired hw def file into the directory
        if (params.replaceFile) {
            this.logger.debug(`Copied ${params.replaceFile} to ${this.paramDefaultsFile}`);
            fs.copyFileSync(params.replaceFile, this.paramDefaultsFile);
        }

        //Append any extra param values
        if (params.append) {
            fs.appendFileSync(this.paramDefaultsFile, Buffer.from(`\n`));
            for (const param in params.append) {
                const value = params.append[param];
                this.logger.debug(`Adding "${param} ${value}" to the params file`);
                fs.appendFileSync(this.paramDefaultsFile, Buffer.from(`${param} ${value}\n`));
            }
        }
    }

    /**
     * Run the ArduPilot build process
     */
    async runBuild() {
        const process = new Process("bash", undefined, this.buildLocation);
        return new Promise<void>((resolve) => {
            this.logger.log(`Begin building the firmware!`);
            process.on(ProcessEvent.data, (data: any) => { this.logger.debug(data.toString()); });
            process.on(ProcessEvent.error, (error: any) => { this.logger.error(error.toString()); });
            process.on(ProcessEvent.close, (code: any) => { this.logger.debug(`Process exited with ${code}`); resolve(); });

            if (this.buildFor.distClean) { process?.execute(`./waf distclean`); }



            // //Reset git
            // if (git.reset) {
            //     process?.execute(`git reset --hard`);
            // }

            process?.exit();
        });
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
        try {
            await this.downloadRepo();
            await this.copyRepo();
            await this.processGit();
            await Promise.all([
                this.processLUA(),
                this.processHWDef()
            ]);
            await this.processParameters();
            await this.runBuild();
            this.logger.success(`Build complete!`);
        }
        catch (e) {
            this.logger.error("Build failed!");
            this.buildError = e as string;
            throw e;
        }
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
            return new Promise<void>(async (resolve) => {
                try { await builder.build(); }
                catch (e) { }
                resolve();
            });
        })));

        //Print our results
        let success = [];
        let failed = [];
        for (let build of this.builders) {
            if (!build.buildError) { success.push(build); }
            else { failed.push(build); }
        }

        if (failed.length == 0) {
            this.logger.success(`All ${this.builders.length} board(s) built successfully!`);
        }
        else {
            this.logger.success(`${success.length}/${this.builders.length} board(s) were built successfully`);
            this.logger.error(`${failed.length}/${this.builders.length} failed building`);
            for (let build of failed) {
                this.logger.error(`${build.name} failed: ${build.buildError ?? "unknown"}`);
            }
        }

        //Destroy our process at the end
        this.process?.destroy();
    }
}
