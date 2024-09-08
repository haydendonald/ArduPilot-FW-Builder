// import { EventEmitter } from "stream";
// import { Board, HWDef, Parameter, Target } from "./definitions";
// import path = require("path");
// import { exec, execSync, spawn } from "child_process";
// import * as fs from "fs";






// export declare interface FirmwareBuilder {
//     on(event: "executeCommand", listener: (command: string, directory: string) => void): this;
//     on(event: "changedDirectory", listener: (directory: string) => void): this;
//     on(event: "stdout", listener: (data: string) => void): this;
//     on(event: "stderr", listener: (data: string) => void): this;
// }







// export class FirmwareBuilder extends EventEmitter {


//     constructor(options: BuildOptions) {
//         super();
//         this.options = options;


//     }


//     /**
//      * Execute a command
//      * @param command The command to execute
//      * @returns A promise resolves with the exit code
//      */
//     private runCommand(command: string): Promise<number | null> {
//         return new Promise((resolve) => {
//             this.emit("executeCommand", command, this.currentDirectory);
//             var split = command.split(" ");
//             var process = spawn(split[0], split.slice(1), { cwd: this.currentDirectory });
//             process.on("exit", (code) => { resolve(code); });
//             process.stdout.on('data', (data) => { this.emit("stdout", data); });
//             process.stderr.on('data', (data) => { this.emit("stderr", data); });
//         });
//     }

//     /**
//      * Change directory
//      * @param directory The directory to change to
//      */
//     private changeDirectory(directory: string) {
//         this.oldDirectory = this.currentDirectory;
//         this.currentDirectory = directory;
//         this.emit("changedDirectory", this.currentDirectory);
//     }

//     /**
//      * Download the required repositories
//      */
//     private async download(): Promise<void> {
//         //Make sure we have our directories
//         if (!fs.existsSync(this.repoDirectory)) { fs.mkdirSync(this.repoDirectory); }
//         if (!fs.existsSync(this.buildDirectory)) { fs.mkdirSync(this.buildDirectory); }

//         //Start by checking if we have already downloaded the repo(s), if not download them
//         for (var build of this.options.buildFor) {
//             if (!this.repoName(build)) { continue; }
//             if (!fs.existsSync(path.join(this.repoDirectory, this.repoName(build) as string))) {
//                 this.changeDirectory(this.repoDirectory);
//                 await this.runCommand(`git clone -b ${build.gitBranch} ${build.gitRepo} ${this.repoName(build)}`);
//             }
//         }

//         //Next copy in the repositories into the build directory
//         var waitingFor = [];
//         for (var build of this.options.buildFor) {
//             if (!this.repoName(build)) { continue; }
//             var repoName = this.repoName(build) as string;
//             var repoPath = path.join(this.repoDirectory, repoName);
//             var buildPath = path.join(this.buildDirectory, repoName);
//             if (!fs.existsSync(buildPath)) {
//                 waitingFor.push(new Promise<void>((resolve) => {
//                     fs.cpSync(repoPath, buildPath, { recursive: true });
//                     resolve();
//                 }));
//             }
//         }
//         await Promise.all(waitingFor);
//     }

//     private async clean(): Promise<void> {
//         //./waf distclean
//     }

//     /**
//      * Configure the build
//      */
//     private async configure(): Promise<void> {
//         //./waf configure --board CubeBlack
//     }

//     /**
//      * Prepare the build editing relevant files
//      */
//     private async prepare(): Promise<void> {
//     }

//     /**
//      * Build the firmware
//      */
//     private async buildFirmware(): Promise<void> {
//         //./waf copter
//     }

//     private async upload(): Promise<void> {
//         // ./waf --targets bin/arducopter --upload
//     }

//     /**
//      * Do the full build process
//      */
//     async build() {
//         await this.changeDirectory(this.baseDirectory);
//         await this.download();
//         await this.clean();
//         await this.configure();
//         await this.prepare();
//         await this.buildFirmware();
//         await this.upload();
//     }
// }





// // import { execSync } from "child_process";
// // import * as chalk from "chalk";
// // import * as fs from "fs";
// // import * as path from "path";
// // import * as readline from "readline";
// // const inquirer = require('inquirer');

// // export class Board {
// //     board: string;
// //     buildFor: string;
// //     firmwareFile: string;

// //     gitRepo?: string;
// //     gitBranch?: string;
// //     luaFile?: string[] = [];
// //     params?: Record<string, string> = {};
// //     hwDef?: string | string[] = [];
// //     boardLocation?: string = "";
// //     buildDirectory?: string = "";

// //     resetGit?: boolean;
// //     setParams?: boolean;
// //     setHWDef?: boolean;
// //     upload?: boolean;
// //     includeLua?: boolean;
// //     mavproxy?: boolean;
// // }

// // export class FirmwareBuilder {
// //     //Arguments
// //     buildFor: string[]; //What should we build for. Argument: --buildFor <board1>,<board2>,<board3>
// //     includeLua: boolean; //Should we include the LUA script. Argument: --includeLua true/false
// //     setParams: boolean; //Should we set the params. Argument: --setParams true/false
// //     setHWDef: boolean; //Should we set the HW def. Argument: --setHWDef true/false
// //     upload: boolean; //Should we upload the firmware. Argument: --upload true/false
// //     resetGit: boolean; //Should we reset the git repo. Argument: --resetGit true/false
// //     boards: Record<string, Board>; //A list of possible boards
// //     mavproxy: boolean; //Should we open MAVProxy. Argument: --mavproxy true/false

// //     oldDirectory: string;
// //     baseDirectory: string = path.join(__dirname, "..", "..", "..");
// //     currentDirectory: string = this.baseDirectory;
// //     currentBoard: string = "";
// //     currentRepo: string | undefined = "";
// //     ardupilotLocation: string = "ardupilot";

// //     constructor(boards: Record<string, Board>, ardupilotLocation?: string) {
// //         this.boards = boards;
// //         if (ardupilotLocation !== undefined) { this.ardupilotLocation = ardupilotLocation; }
// //     }

// //     /**
// //      * Read in the arguments
// //      */
// //     async readArguments() {
// //         //Read in any arguments
// //         for (var i = 0; i < process.argv.length; i++) {
// //             var arg = process.argv[i];
// //             switch (arg) {
// //                 case "--buildFor": {
// //                     if (process.argv[i + 1].includes(",")) {
// //                         this.buildFor = process.argv[i + 1].split(",");
// //                     }
// //                     else {
// //                         this.buildFor = [process.argv[i + 1]];
// //                     }
// //                     i++;
// //                     break;
// //                 }
// //                 case "--includeLua": {
// //                     this.includeLua = process.argv[i + 1] != "false";
// //                     i++;
// //                     break;
// //                 }
// //                 case "--setParams": {
// //                     this.setParams = process.argv[i + 1] != "false";
// //                     i++;
// //                     break;
// //                 }
// //                 case "--setHWDef": {
// //                     this.setHWDef = process.argv[i + 1] != "false";
// //                     i++;
// //                     break;
// //                 }
// //                 case "--upload": {
// //                     this.upload = process.argv[i + 1] != "false";
// //                     i++;
// //                     break;
// //                 }
// //                 case "--resetGit": {
// //                     this.resetGit = process.argv[i + 1] != "false";
// //                     i++;
// //                     break;
// //                 }
// //                 case "--mavproxy": {
// //                     this.mavproxy = process.argv[i + 1] != "false";
// //                     i++;
// //                     break;
// //                 }
// //             }
// //         }

// //         //Ask for any missing arguments
// //         if (this.buildFor === undefined) {
// //             if (Object.keys(this.boards).length > 1) {
// //                 var types = await this.select("What device(s) to build for?", Object.keys(this.boards), true);
// //                 if (typeof types == "string") { types = [types]; }
// //                 this.buildFor = (types) || [];
// //             }
// //             else {
// //                 this.buildFor = [Object.keys(this.boards)[0]];
// //             }
// //         }

// //         if (this.includeLua === undefined || this.setParams === undefined || this.setHWDef === undefined
// //             || this.resetGit === undefined || this.upload === undefined) {
// //             if ((await this.select("Change specific options?", ["No", "Yes"])) == "Yes") {
// //                 if (this.includeLua === undefined) { this.includeLua = (await this.select("Should the LUA file be included in this build?", ["Yes", "No"])) == "Yes"; }
// //                 if (this.setParams === undefined) { this.setParams = (await this.select("Should we add the params?", ["Yes", "No"])) == "Yes"; }
// //                 if (this.setHWDef === undefined) { this.setHWDef = (await this.select("Should we add the extra HW def lines?", ["Yes", "No"])) == "Yes"; }
// //                 if (this.resetGit === undefined) { this.resetGit = (await this.select("Should we reset the GitHub repo?", ["Yes", "No"])) == "Yes"; }
// //                 if (this.buildFor.length == 1) {
// //                     if (this.upload === undefined) { this.upload = (await this.select("Should we upload to the board?", ["No", "Yes"])) == "Yes"; }
// //                     if (this.mavproxy === undefined) { this.mavproxy = (await this.select("Should we open MAVProxy?", ["No", "Yes"])) == "Yes"; }
// //                 }
// //             }
// //         }
// //         if (this.includeLua === undefined) { this.includeLua = true; }
// //         if (this.setParams === undefined) { this.setParams = true; }
// //         if (this.setHWDef === undefined) { this.setHWDef = true; }
// //         if (this.resetGit === undefined) { this.resetGit = true; }
// //         if (this.upload === undefined) { this.upload = false; }
// //         if (this.mavproxy === undefined) { this.mavproxy = false; }
// //     }

// //     //Setup our bash process
// //     runCommand(command: string, setDirectory: boolean = false) {
// //         var cmd = `${setDirectory == true ? `cd ${this.currentDirectory} &&` : ""} ${command}`;
// //         console.log(chalk.bgGray(`[${this.currentDirectory}] Running: ${cmd}`));
// //         const subProcess = execSync(cmd, { stdio: [process.stdin, process.stdout, process.stderr] });
// //     }

// //     //Change the current directory
// //     changeDirectory(directory: string) {
// //         this.oldDirectory = this.currentDirectory;
// //         this.currentDirectory = path.join(this.baseDirectory, directory);
// //         console.log(chalk.bgGreenBright(`Changing directory to: ${this.currentDirectory}`));
// //     }

// //     gotoBaseDirectory() {
// //         this.changeDirectory("");
// //     }

// //     /**
// //      * Build a board
// //      */
// //     async buildBoard(name: string, board: Board) {
// //         this.currentBoard = board.board;
// //         this.currentRepo = await this.getFirstLine(`${this.baseDirectory}/${this.ardupilotLocation}/repoName`);

// //         var resetGit = board.resetGit === undefined ? this.resetGit : board.resetGit;
// //         var setParams = board.setParams === undefined ? this.setParams : board.setParams;
// //         var setHWDef = board.setHWDef === undefined ? this.setHWDef : board.setHWDef;
// //         var upload = board.upload === undefined ? this.upload : board.upload;
// //         var includeLua = board.includeLua === undefined ? this.includeLua : board.includeLua;
// //         var mavproxy = board.mavproxy === undefined ? this.mavproxy : board.mavproxy;

// //         //Clone the repo if it's different, otherwise reset it
// //         var needClone = false;
// //         if (!fs.existsSync(`${this.baseDirectory}/${this.ardupilotLocation}`)) {
// //             needClone = true;
// //             console.log(chalk.yellowBright("Cloning the repo as it doesn't exist"));
// //         }

// //         if (needClone || (resetGit == true && board.gitRepo && board.gitBranch)) {
// //             console.log("OK")
// //             if (`${board.gitRepo}:${board.gitBranch}` != this.currentRepo) {
// //                 this.runCommand(`rm -rf ${this.baseDirectory}/${this.ardupilotLocation}`);
// //                 this.runCommand(`git clone -b ${board.gitBranch} ${board.gitRepo} ardupilot --recurse-submodules`, true);
// //                 this.runCommand(`rm -f ${this.baseDirectory}/${this.ardupilotLocation}/repoName`);
// //                 this.runCommand(`touch ${this.baseDirectory}/${this.ardupilotLocation}/repoName`);
// //                 this.runCommand(`echo "${board.gitRepo}:${board.gitBranch}" > ${this.baseDirectory}/${this.ardupilotLocation}/repoName`);
// //             }
// //             else {
// //                 this.changeDirectory(this.ardupilotLocation);
// //                 this.runCommand(`git reset --hard`, true);
// //             }
// //         }

// //         if (!board.boardLocation) { board.boardLocation = `${this.ardupilotLocation}/libraries/AP_HAL_ChibiOS/hwdef/${this.currentBoard}`; }
// //         if (!board.buildDirectory) { board.buildDirectory = `${this.ardupilotLocation}/build/${this.currentBoard}`; }

// //         //Check if there is a defaults.param file, if not create an empty one
// //         if (!fs.existsSync(`${this.baseDirectory}/${board.boardLocation}/defaults.parm`)) {
// //             this.runCommand(`touch ${this.baseDirectory}/${board.boardLocation}/defaults.parm`);
// //         }

// //         //If there is no backup of the default params, backup the default params
// //         if (!fs.existsSync(`${this.baseDirectory}/${board.boardLocation}/defaults.parm.bak`)) {
// //             this.runCommand(`cp ${this.baseDirectory}/${board.boardLocation}/defaults.parm ${this.baseDirectory}/${board.boardLocation}/defaults.parm.bak`);
// //         }

// //         //Add the params
// //         if (setParams == true) {
// //             for (var param in board.params) {
// //                 this.runCommand(`grep -qxF "${param} ${board.params[param]}" ${this.baseDirectory}/${board.boardLocation}/defaults.parm || echo "${param} ${board.params[param]}" >> ${this.baseDirectory}/${board.boardLocation}/defaults.parm`);
// //             }
// //         }

// //         //If there is no backup of the hwdef, backup the hw def
// //         if (!fs.existsSync(`${this.baseDirectory}/${board.boardLocation}/hwdef.dat.bak`)) {
// //             this.runCommand(`cp ${this.baseDirectory}/${board.boardLocation}/hwdef.dat ${this.baseDirectory}/${board.boardLocation}/hwdef.dat.bak`);
// //         }

// //         if (setHWDef == true && board.hwDef !== undefined) {
// //             //If there are lines add them to the hwdef
// //             if (Array.isArray(board.hwDef)) {
// //                 for (var i in board.hwDef) {
// //                     this.runCommand(`grep -qxF "${board.hwDef[i]}" ${this.baseDirectory}/${board.boardLocation}/hwdef.dat || echo "${board.hwDef[i]}" >> ${this.baseDirectory}/${board.boardLocation}/hwdef.dat`);
// //                 }
// //             }
// //             //Otherwise replace the hwdef with the given file
// //             else {
// //                 this.runCommand(`rm ${this.baseDirectory}/${board.boardLocation}/hwdef.dat`);
// //                 this.runCommand(`cp ${this.baseDirectory}/${board.hwDef} ${this.baseDirectory}/${board.boardLocation}/hwdef.dat`);
// //             }
// //         }

// //         //LUA
// //         if (includeLua == true && board.luaFile) {
// //             //Generate the LUA script(s)
// //             this.runCommand(`mkdir -p ${this.baseDirectory}/luaBuild`);
// //             this.runCommand(`rm -f ${this.baseDirectory}/luaBuild/${this.currentBoard}.lua`);
// //             this.runCommand(`touch ${this.baseDirectory}/luaBuild/${this.currentBoard}.lua`);

// //             //Add the build date ad the function build_date()
// //             var date = new Date();
// //             var dateStr: string = ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + date.getFullYear();
// //             this.runCommand(`echo "function build_date() return '${dateStr}' end" >> ${this.baseDirectory}/luaBuild/${this.currentBoard}.lua`);

// //             //Copy in the LUA scripts
// //             for (var i in board.luaFile) {
// //                 this.runCommand(`echo "-- Include LUA script from ${this.baseDirectory}/${board.luaFile[i]}" >> ./luaBuild/${this.currentBoard}.lua`);
// //                 this.runCommand(`cat ${this.baseDirectory}/${board.luaFile[i]} >> ./luaBuild/${this.currentBoard}.lua`);
// //             }

// //             //Copy the LUA script to the board
// //             this.runCommand(`mkdir -p ${this.baseDirectory}/${board.boardLocation}/scripts`);
// //             this.runCommand(`cp ${this.baseDirectory}/luaBuild/${this.currentBoard}.lua ./${board.boardLocation}/scripts/${this.currentBoard}.lua`);
// //         }
// //         else {
// //             this.runCommand(`rm -rf ${this.baseDirectory}/${board.boardLocation}/scripts`);
// //         }

// //         //Ok build it!
// //         this.changeDirectory(this.ardupilotLocation);
// //         this.runCommand(`./waf distclean`, true);
// //         this.runCommand(`./waf configure --board ${this.currentBoard} --debug`, true);
// //         this.runCommand(`./waf ${board.buildFor || "plane"}`, true);
// //         this.gotoBaseDirectory();

// //         //Copy the firmware
// //         this.runCommand(`mkdir -p ${this.baseDirectory}/firmware/${name}`);
// //         this.runCommand(`rm -f ${this.baseDirectory}/firmware/${name}/${board.firmwareFile}.apj`);
// //         this.runCommand(`rm -f ${this.baseDirectory}/firmware/${name}/${board.firmwareFile}_with_bl.hex`);
// //         this.runCommand(`cp ${this.baseDirectory}/${board.buildDirectory}/bin/${board.firmwareFile}.apj ${this.baseDirectory}/firmware/${name}/${board.firmwareFile}.apj`);
// //         this.runCommand(`cp ${this.baseDirectory}/${board.buildDirectory}/bin/${board.firmwareFile}_with_bl.hex ${this.baseDirectory}/firmware/${name}/${board.firmwareFile}_with_bl.hex`);

// //         //Cleanup
// //         this.runCommand(`rm -rf ${this.baseDirectory}/${board.boardLocation}/scripts`);
// //         this.runCommand(`cp ${this.baseDirectory}/${board.boardLocation}/defaults.parm.bak ${this.baseDirectory}/${board.boardLocation}/defaults.parm`);
// //         this.runCommand(`rm ${this.baseDirectory}/${board.boardLocation}/defaults.parm.bak`);
// //         this.runCommand(`cp ${this.baseDirectory}/${board.boardLocation}/hwdef.dat.bak ${this.baseDirectory}/${board.boardLocation}/hwdef.dat`);
// //         this.runCommand(`rm ${this.baseDirectory}/${board.boardLocation}/hwdef.dat.bak`);

// //         //Upload the firmware
// //         if (upload == true) {
// //             this.runCommand(`python ${this.baseDirectory}/${this.ardupilotLocation}/Tools/scripts/uploader.py ${this.baseDirectory}/firmware/${name}/${board.firmwareFile}.apj`);
// //         }


// //         //Open MAVProxy
// //         if (mavproxy == true) {
// //             await new Promise((resolve) => { setTimeout(resolve, 5000) });
// //             this.runCommand(`mavproxy.py`);
// //         }
// //     }

// //     //Ask the user to select something
// //     async select(prompt: string, options: string[], multiple = false): Promise<string[] | string> {
// //         return new Promise((resolve) => {
// //             var choices = [];
// //             for (var i in options) {
// //                 choices.push({
// //                     name: options[i],
// //                     value: options[i]
// //                 });
// //                 choices.push(new inquirer.Separator());
// //             }

// //             inquirer.prompt([{
// //                 type: multiple == true ? "checkbox" : "list",
// //                 name: "select",
// //                 message: prompt,
// //                 choices,
// //             }]).then(async function (answers: any) {
// //                 resolve(answers.select);
// //             });
// //         });
// //     }

// //     async getFirstLine(pathToFile: string): Promise<string | undefined> {
// //         return new Promise(async (resolve) => {
// //             if (!fs.existsSync(pathToFile)) { resolve(undefined); return; }
// //             const readable = fs.createReadStream(pathToFile);
// //             const reader = readline.createInterface({ input: readable });
// //             reader.on('line', (line) => {
// //                 reader.close();
// //                 readable.close();
// //                 resolve(line);
// //             });
// //         });
// //     }

// //     async run() {
// //         console.log("Welcome to the build script!");
// //         console.log(chalk.bgGreenBright("Starting at directory: " + this.currentDirectory));
// //         await this.readArguments();
// //         console.log(chalk.bgGreenBright("Building for: " + this.buildFor.join(", ")));
// //         await new Promise((resolve) => { setTimeout(resolve, 1000) });

// //         //Build the boards
// //         for (var i in this.buildFor) {
// //             var board = this.boards[this.buildFor[i]];
// //             console.log(chalk.bgYellowBright(`Building board: ${this.buildFor[i]}`));
// //             await this.buildBoard(this.buildFor[i], board);
// //         }
// //     }
// // }