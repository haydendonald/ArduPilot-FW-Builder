import { Board, Boards, Build, Target } from "./lib/definitions";
import { BoardBuilder, BuildArguments, MultiBuilder } from "./lib/builder"
import { resolve } from "path";

async function run() {
    var testBoard: Build = {
        board: Boards.CubeOrange,
        target: Target.plane,
        lua: {
            include: true,
            enableScripting: true,
            luaFiles: [
                {
                    file: ["lol.lua", "lol.lua"],
                    helperFunctions: [
                        //build_date()
                        (() => {
                            var date = new Date();
                            var dateStr: string = ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + date.getFullYear();
                            return `function build_date() return '${dateStr}' end`
                        }
                        )()
                    ],
                    validateSyntax: true
                },
                {
                    outputName: "penis.lua",
                    file: "lol.lua",
                    helperFunctions: [
                        //build_date()
                        (() => {
                            var date = new Date();
                            var dateStr: string = ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + date.getFullYear();
                            return `function build_date() return '${dateStr}' end`
                        }
                        )()
                    ],
                    validateSyntax: true
                }
            ]
        },
        git: {
            reset: true
        }
    };
    // var testBoard2: Build = {
    //     board: Board.CubeBlack,
    //     target: Target.plane,
    //     gitRepo: "git@github.com:haydendonald/ardupilot.git",
    //     gitBranch: "master"
    // };

    var buildArguments: BuildArguments = {
        includeLua: true,
        setParams: true,
        setHWDef: true,
        upload: true,
        resetGit: true,
        connectMAVProxy: true
    }


    var testBoard1 = new BoardBuilder(testBoard);
    // var testBoard3 = new BoardBuilder(testBoard2);


    let builder = new MultiBuilder([testBoard1], buildArguments)
    await builder.build();


    // builder.on("stdout", (data) => {
    //     console.log(data.toString());
    // });

    // builder.on("stderr", (data) => {
    //     console.log(data.toString());
    // });

    // builder.on("executeCommand", (command, directory) => {
    //     console.log(`[${directory}] - ${command}`);
    // });


    //await builder.build();
}
run();